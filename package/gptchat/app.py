import os
import inspect
from uuid import uuid4
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit
from typing import Literal, get_args, TypedDict

ServerChannel = Literal[
    "connect",
    "send-message",
    "stop-generating",
]
SERVER_CHANNELS = set(get_args(ServerChannel))

ClientChannel = Literal[
    "config",
    "finish-generating",
    "update-message",
    "error",
]
CLIENT_CHANNELS = set(get_args(ClientChannel))


package_dir = os.path.dirname(__file__)
build_path = os.path.join(package_dir, '..', 'build')

app = Flask(__name__, static_folder=build_path)
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode="eventlet",
    async_handlers=True,
)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    """
    Runs when the user visits the website. Responds by sending the frontend code.
    """
    print("INDEX HIT")
    assert app.static_folder is not None
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


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


def finish_generating(to: str | None = None, **kwargs):
    return socket_emit("finish-generating", to=to, **kwargs)


class Config(TypedDict, total=False):
    messages: list[dict]
    functions: dict


def handle_send_message(func):
    param_names = set(inspect.signature(func).parameters.keys())
    assert param_names == {"messages"}, (
        "Your send message handler should accept just one parameter: `messages`"
    )
    @socketio.on("send-message")
    def wrapper(arguments: dict):
        try:
            func(**arguments)
        except Exception as e:
            socket_emit("error", f"{type(e).__name__}: {e}")
            sleep(.05)
            raise e
        finally:
            finish_generating()

    return wrapper


def handle_connect(func):
    return socketio.on("connect")(func)


def update_message(delta: dict, id: str | None = None, to: str | None = None, **kwargs):
    if id:
        delta["id"] = str(id)

    assert "id" in delta, "Must provide a message 'id' to update"
    return socket_emit("update-message", delta, to=to, **kwargs)


CONFIG: Config | dict = {}


def set_config(config: dict | Config):
    global CONFIG
    CONFIG = {**CONFIG, **config}


@handle_connect
def connect():
    if CONFIG:
        socket_emit("config", CONFIG)


def run_app(**kwargs):
    socketio.run(app, **kwargs)
