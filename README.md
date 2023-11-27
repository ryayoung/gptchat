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

@app.handle_send_message
def message_handler(messages):
    # get response from openai
    response = openai_client.chat.completions.create(
        messages=messages,
        model="gpt-4",
    )
    new_msg = response.choices[0].message

    # send update to frontend
    app.update_message(new_msg)
    

app.run_app(debug=True, port=5002)
```

That doesn't look quite like ChatGPT yet. The response is sent all at once, after a long delay. Let's try **streaming** instead.

We'll define a utility function to stream an OpenAI response

```py
def openai_chat_stream(messages, model: str = "gpt-4", **kwargs):
    """
    Streams an OpenAI chat completion message, and yields deltas.
    """
    stream = openai_client.chat.completions.create(
        messages=messages,
        model=model,
        stream=True,
        **kwargs
    )
    for chunk in stream:
        if chunk.choices:
            yield chunk.choices[0]
```

On the frontend, each message must have a unique identifier. In the previous example, when we ran
`app.update_message(new_msg)`, a unique `id` was was assigned to `new_msg` for us.

But when sending partial updates, we need to make sure each update
has the same `id`, so they can be combined into a single message.

Here's a new version of `message_handler()` for streaming.

```py
@app.handle_send_message
def message_handler(messages):
    stream = openai_chat_stream(messages)

    id = app.new_id()
    for chunk in stream:
        app.update_message(chunk.delta, id=id)
```

## Optional Configuration

Configurations can be set using the `set_config()` function:
```py
app.set_config({
    "some_option": "some value",
    "some_option2": "some other value",
})
```

The following options are available:

### `messages`

> Useful during development, set the app to start with some messages already in the chat.

```py
app.set_config({
    "messages": [
        { "role": "user", "content": "Hello, how are you?" },
        { "role": "assistant", "content": "I'm doing great, how can I help you today?" },
    ]
})
```

### `functions`

> Specify display headers for function/tool calls

By default, function calls are displayed with a header, "Function call to your_function()":

<img width="396" alt="Screenshot" src="https://github.com/ryayoung/ryayoung/assets/90723578/bd71eca1-9f36-40a6-94da-6bcc0fb2a5b7">

The `functions` option lets you change what gets displayed here, for any functions.

The text you provide is rendered as markdown.

```py
app.set_config({
    "functions": {
        "get_stock_price": "Fetching **stock price**...",
    }
})
```

<img width="284" alt="Screenshot2" src="https://github.com/ryayoung/ryayoung/assets/90723578/739e6536-2148-4537-a38b-9cf797f2b190">


## Utilities

### `concat_stream()`

> Combine all the partial updates received from an OpenAI stream into a single message Choice.

An essential tool when streaming responses from OpenAI while using function/tool calling.
Keep a record of all the accumulated updates received during a stream, and use `concat_stream()` to combine
them into a single message Choice.

Let's rewrite our `message_handler()` function from the earlier example, to use `concat_stream()` so it can handle function calls.

```py
from gptchat.utils import concat_stream

@app.handle_send_message
def message_handler(messages):
    stream = openai_chat_stream(messages)

    id = app.new_id()
    streamed_chunks = []
    for chunk in stream:
        app.update_message(chunk.delta, id=id)
        streamed_chunks.append(chunk)

    full_message = concat_stream(streamed_chunks)
    # Do something with the full message, like handle function calls
```


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
