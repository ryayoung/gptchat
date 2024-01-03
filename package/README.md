# gptchat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://pypi.org/project/gptchat/"><img src="https://img.shields.io/pypi/v/gptchat.svg" height="21"/></a>

#### _NOTE: Still in early development. Documentation not available yet._

```
pip install gptchat
```

`gptchat` makes it easy to develop with OpenAI's API, without having to build your own user interface.

This python package lets you instantly host a ChatGPT look-alike frontend application on your machine.

As the developer, your only responsibility is to define what happens on the server when the user sends a message.

When the user hits send, the conversation (a list of [OpenAI Message objects](https://platform.openai.com/docs/api-reference/chat/object))
will be passed to your handler function. You have **full control** over what to send back, and when. While your handler function is
executing, you may emit updates with full messages, or partial messages (deltas) if streaming.

Function calls (and soon, tool calls) are fully supported. The frontend will render function/tool calls
for you, in the same style as ChatGPT.

#### Minimal learning curve necessary

`gptchat`'s API is merely a reflection of the OpenAI API. Any data you send in the `messages` argument to OpenAI can also
be passed to the `gptchat` frontend, where it will be rendered.

## Getting Started

A **minimal** configuration to get you up and running.

```py
from gptchat import app
from openai import OpenAI

openai_client = OpenAI(api_key="YOUR_API_KEY")

@app.handle_start_generating
def start_generating(messages):
    # get response from openai
    response = openai_client.chat.completions.create(
        messages=messages,
        model="gpt-4",
    )
    new_msg = response.choices[0].message

    # send update to frontend
    app.set_message(new_msg)
    

app.run_app(debug=True, port=5002)
```

To stream messages like in ChatGPT, pass an openai stream to `stream_updates()`. When the stream is finished,
this function will return the full message (all stream deltas combined).

```py
@app.handle_start_generating
def start_generating(messages):
    stream = openai_client.chat.completions.create(
        messages=messages,
        model="gpt-4",
        stream=True,
    )
    full_message = app.stream_updates(stream)
    # At this point the chunks have already been streamed to the client,
    # so no further action required.
    # But if you want to handle function calls in `full_message`, you can call
    # `app.set_message(...)` again with the function result, and stream another
    # response.
```

## Optional Configuration

Configurations can be set with the `config` global:
```py
app.config = {
    "functions": {
        "get_weather": {
            "result_type": "markdown",
        },
        "get_stock_price": {
            "title": "Fetching **stock price**...",
        }
    }
}
```


### `default_messages`

> Set default messages to appear whenever a new chat is created.

```py
app.default_messages = [
    {
        "role": "assistant",
        "content": "Hello, how may I assist you today?",
    },
]
```

### `functions`

> Customize how function calls are displayed

#### `functions.result_type`

Change how the function result is rendered on the page.

Values: `markdown` or `text` (default `text`)

#### `functions.title`

Set a custom title for a function.

By default, function calls are displayed with a title, "Function call to `your_function()`":

<img width="396" alt="Screenshot" src="https://github.com/ryayoung/ryayoung/assets/90723578/bd71eca1-9f36-40a6-94da-6bcc0fb2a5b7">

You can change this by setting `title`. The text you provide is rendered as markdown.

```py
app.config = {
    "functions": {
        "get_stock_price": {
            "title": "Fetching **stock price**...",
        }
    }
}
```

<img width="284" alt="Screenshot2" src="https://github.com/ryayoung/ryayoung/assets/90723578/739e6536-2148-4537-a38b-9cf797f2b190">


## Utilities

### `concat_stream()`

> Combine all the partial updates received from an OpenAI stream into a single message Choice.

This is done already, when you call `stream_updates()`. Use this function if you want to handle the
stream yourself and combine the deltas afterwards.


# Notes for Contributors

This project has two parts:
1. `/client`: Frontend typescript application. All the core logic of `gptchat` runs here,
in the browser. This builds a static bundle to the python package. (`/package/build`)
3. `/package`: A python package that acts as the plumbing for your server. It takes care
of serving the client bundle, and provides wrapper functions for implementing your websocket communications.

### Getting started

Client source: `/client/src/lib`. (Note, the bulk of the logic and state management is in `main.ts`.)

Python package source: `/package/gptchat`

- **Run the frontend on a dev server**: From `/client`, run `npm install`. To start the server, use `npm run dev`.
  - In production, there is only one server, so the client code uses an empty string
as the URL path for the websocket connection, which makes a request from the current URL. But in development, the
frontend runs on a separate Vite server. To connect to a separate Flask server running locally, visit the `socket.ts`
module, switch `PROD=false`, and ensure the URL matches the port of your local flask server.
- **Build the frontend**: From `/client`, run `npm run build`. This should save the bundle to `/package/build`.
  - The python server expects this `bundle` directory to be present when the flask app starts. So it's recommended to
do this **first**, even if you're just starting development, and even if your client bundle doesn't work. The build only
gets served if you visit your Flask server's URL in the browser, which isn't necessary for development anyway.
- **Install `gptchat` in editable mode**: Once you've ran `npm run build` at least once, install the python package by
running `pip install -e .` from inside `/package`, using whatever virtual environment you'll be developing out of.
  - You only have to do this once. An editable pip install means that `import gptchat` will always pull from the current state of
the source code on your machine. So you can write your test app scripts anywhere on your machine, while directly making code changes in `/gptchat`
