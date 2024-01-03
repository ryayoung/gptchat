import os
import time
import inspect
from uuid import uuid4
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit
from typing import Literal, get_args, TypedDict
from gptchat.utils import iter_stream_choices, concat_stream

ServerChannel = Literal[
    "connect",
    "send-message",
    "stop-generating",
]
SERVER_CHANNELS = set(get_args(ServerChannel))

ClientChannel = Literal[
    "connect",
    "config",
    "default-messages",
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

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve(path):
    """
    Runs when the user visits the website. Responds by sending the frontend code.
    """
    accept_encoding = request.headers.get("Accept-Encoding", "")
    dir = app.static_folder
    assert dir is not None

    original_file = os.path.join(dir, path)
    br_file = original_file + '.br'
    gz_file = original_file + '.gz'

    # Send compressed, if browser supports
    if 'br' in accept_encoding and os.path.exists(br_file):
        res = send_from_directory(dir, path + '.br')
        res.headers['Content-Encoding'] = 'br'
    elif 'gzip' in accept_encoding and os.path.exists(gz_file):
        res = send_from_directory(dir, path + '.gz')
        res.headers['Content-Encoding'] = 'gzip'
    else:
        res = send_from_directory(dir, path)

    # Caching headers
    days_to_cache = 365
    max_age = 86400 * days_to_cache
    res.headers['Cache-Control'] = f'max-age={max_age}, public'
    res.headers['Expires'] = time.strftime("%a, %d-%b-%Y %H:%M:%S GMT", time.gmtime(time.time() + max_age))

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


def start_generating(func):
    param_names = set(inspect.signature(func).parameters.keys())
    assert param_names == {"messages"}, (
        "Your send message handler should accept just one parameter: `messages`"
    )
    @socketio.on("start-generating")
    def wrapper(arguments: dict):
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


def stream_updates(stream: Stream[ChatCompletionChunk], delay: float = 0.0) -> Choice:
    id = new_id()
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


class Config(TypedDict, total=False):
    messages: list[dict]
    functions: dict


config: Config | dict = {}
default_messages: list[dict] = []


@handle_connect
def connect():
    if config:
        socket_emit("config", config)
    if default_messages:
        socket_emit("default-messages", default_messages)


def run_app(port: int = 5000, **kwargs):
    kwargs["port"] = port
    socketio.run(app, **kwargs)
