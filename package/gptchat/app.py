import os
import re
import inspect
from uuid import uuid4
from flask import Flask, request, abort
from flask_socketio import SocketIO, emit
from typing import Literal, get_args, TypedDict
from gptchat.util.openai_util import iter_stream_choices, concat_stream
from gptchat.util.serve import (
    get_static_responses_from_dir,
    get_filename_target,
    make_static_response,
)

ServerChannel = Literal[
    "connect",
    "send-message",
    "stop-generating",
]
SERVER_CHANNELS = set(get_args(ServerChannel))

ClientChannel = Literal[
    "connect",
    "config",
    "message-set-all",
    "message-set",
    "message-update",
    "generating-started",
    "generating-done",
    "error",
]
CLIENT_CHANNELS = set(get_args(ClientChannel))


package_dir = os.path.dirname(__file__)
build_path = os.path.join(package_dir, '..', 'static')

app = Flask(__name__, static_folder=build_path)
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode="eventlet",
    async_handlers=True,
)

days_to_cache = 365
max_age = 86400 * days_to_cache
assert app.static_folder is not None
static_file_responses = get_static_responses_from_dir(app.static_folder, max_age)


@app.route("/", defaults={"filename": "index.html"})
@app.route("/<path:filename>")
def serve(filename):
    """
    Runs when the user visits the website. Responds by sending the frontend code.
    """
    accept_encoding = request.headers.get("Accept-Encoding", "")

    filename_target = get_filename_target(static_file_responses, filename, accept_encoding)

    if not filename_target:
        abort(404)

    res = static_file_responses[filename_target].prepare_conditional_response(request.environ)
    return res


def socket_on(channel: ServerChannel):
    """
    A decorator for registering a handler for events emitted from frontend.
    """
    assert channel in SERVER_CHANNELS, (
        f"Unknown channel. Please add, '{channel}', to the 'ServerChannel' type."
    )

    def decorator(func):
        param_names = set(inspect.signature(func).parameters.keys())

        @socketio.on(channel)
        def wrapper(arguments: dict | None = None):
            if arguments is None:
                return func()

            arg_names = set(arguments.keys())

            assert arg_names == param_names, (
                f"Handler for channel, '{channel}', received arguments which don't match the "
                f"handler's parameters. Expected: {list(param_names)}. Received {list(arg_names)}."
            )
            return func(**arguments)

        return wrapper

    return decorator


def socket_emit(channel: ClientChannel, *args, to: str | None = None, **kwargs):
    """
    Simple wrapper for emitting events to the frontend.
    """
    assert channel in CLIENT_CHANNELS, (
        f"Unknown channel. Please add, '{channel}', to the 'ClientChannel' type."
    )
    if to is None:
        emit(channel, *args, **kwargs)
    else:
        socketio.emit(channel, *args, to=to, **kwargs)

    sleep(0)


def new_id() -> str:
    return str(uuid4())


def sleep(seconds: float):
    return socketio.sleep(seconds) # type:ignore


def generating_done(to: str | None = None, **kwargs):
    return socket_emit("generating-done", to=to, **kwargs)


def generating_started(to: str | None = None, **kwargs):
    return socket_emit("generating-started", to=to, **kwargs)


def handle_start_generating(func):
    param_names = set(inspect.signature(func).parameters.keys())
    assert param_names == {"messages"}, (
        "Your send message handler should accept just one parameter: `messages`"
    )
    @socketio.on("start-generating")
    def wrapper(arguments: dict | list):
        if isinstance(arguments, list):
            arguments = {"messages": arguments}

        generating_started()
        try:
            result = func(**arguments)
            if result is None:
                pass
            elif isinstance(result, dict):
                update_message(result)
            elif isinstance(result, list):
                for msg in result:
                    update_message(msg)
        except Exception as e:
            socket_emit("error", f"{type(e).__name__}: {e}")
            sleep(.05)
            raise e
        finally:
            generating_done()

    return wrapper


def handle_connect(func):
    return socketio.on("connect")(func)


from openai import Stream
from openai.types.chat.chat_completion import Choice
from openai.types.chat.chat_completion_message import ChatCompletionMessage
from openai.types.chat.chat_completion_chunk import ChoiceDelta, ChatCompletionChunk
import pydantic
from typing import Any


def set_all_messages(messages: list[dict]):
    socket_emit("message-set-all", messages)


class ToolCallResult(TypedDict):
    role: Literal["tool"]
    content: str
    tool_call_id: str


def set_message(
    message: dict | ChatCompletionMessage | ToolCallResult,
    id: str | None = None,
    **kwargs,
):
    if isinstance(message, pydantic.BaseModel):
        message = message.model_dump(exclude_unset=True)
    else:
        message = {**message}

    if id:
        message["id"] = str(id)
    else:
        message["id"] = str(new_id())

    return socket_emit("message-set", message, **kwargs)


def stream_updates(stream: Stream[ChatCompletionChunk], delay: float = 0.0, id: str | None = None) -> Choice:
    id = id or new_id()
    choices = []

    for choice in iter_stream_choices(stream):
        choices.append(choice)
        update_message(choice.delta, id=id)
        sleep(delay)

    return concat_stream(choices)


def update_message(
    delta: dict[Any, Any] | ChatCompletionMessage | ChoiceDelta, 
    id: str | None = None, 
    **kwargs,
):
    if isinstance(delta, pydantic.BaseModel):
        delta = delta.model_dump(exclude_unset=True)
    else:
        delta = {**delta}

    if id:
        delta["id"] = str(id)
    else:
        assert "id" in delta, "You must provide an id for the message you want to update. If it's a new message, create an id first"

    return socket_emit("message-update", delta, **kwargs)


class UIConfigPrompt(TypedDict, total=False):
    allow_upload: bool
    placeholder: str


class UIConfig(TypedDict, total=False):
    default_messages: list[dict]
    functions: dict
    agent_name: str
    prompt: UIConfigPrompt
    logo_small: str


class Config(UIConfig, total=False):
    favicon: str


ui_config: UIConfig = {}


def set_config(config: Config):
    global ui_config
    ui_config = {}
    if 'default_messages' in config:
        ui_config['default_messages'] = config['default_messages']
    if 'functions' in config:
        ui_config['functions'] = config['functions']
    if 'agent_name' in config:
        ui_config['agent_name'] = config['agent_name']
    if 'prompt' in config:
        ui_config['prompt'] = config['prompt']

    if 'logo_small' in config:
        logo_path = config['logo_small']
        assert os.path.exists(logo_path), f"File not found: {logo_path}"
        assert logo_path.endswith("svg"), f"Currently only SVG logos are supported"
        with open(logo_path, "r") as f:
            logo = f.read()
        ui_config['logo_small'] = logo

    if 'title' in config:
        index_static_response = static_file_responses['index.html']
        index_html = index_static_response.data.decode()
        index_html = re.sub(r"<title>.*</title>", f"<title>{config['title']}</title>", index_html, flags=re.DOTALL)
        index_static_response.data = index_html.encode()
        index_static_response.size = len(index_html)

    if 'favicon' in config:
        favicon_path = config['favicon']
        assert os.path.exists(favicon_path), f"File not found: {favicon_path}"
        with open(favicon_path, 'rb') as f:
            data = f.read()

        static_file_responses['favicon.svg'] = make_static_response(favicon_path, data, None)


@handle_connect
def connect():
    socket_emit("config", ui_config)


def run_app(port: int = 5000, **kwargs):
    if 'config' in globals():
        print("Setting `app.config = {...}` is deprecated. Use `app.set_config({...})` instead.")
    kwargs["port"] = port
    socketio.run(app, **kwargs)
