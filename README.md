# gptchat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://pypi.org/project/gptchat/"><img src="https://img.shields.io/pypi/v/gptchat.svg" height="21"/></a>

#### _NOTE: Still in early development. Documentation not available yet._

```
pip install gptchat
```

`gptchat` makes it easy to develop with OpenAI's API, without having to build your own user interface.

This python package lets you instantly host a ChatGPT-like frontend application on your machine.

As the developer, your only responsibility is to write the code for what happens on the server when the user sends a message, and how to respond.

The `function_call` api is deprecated, in favor of `tools` and `tool_calls`

#### Minimal learning curve necessary

`gptchat`'s API is merely a reflection of the OpenAI API. Any data you send in the `messages` argument to OpenAI can also
be passed to the frontend, where it will be rendered.

## Getting Started

A **minimal** configuration to get you up and running.

```py
from gptchat import app
from openai import OpenAI

openai_client = OpenAI(api_key="YOUR_API_KEY")

@app.handle_start_generating
def generate_response(messages):
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

### `config`

Configurations can be set with `set_config()`.

```py
app.set_config({
    "functions": {
        "get_stock_price": {
            "header": {
                "text": "Getting stock price...",
            },
            "result": {
                "type": "html",
            }
        }
    },
    "default_messages": [
        {"role": "system", "content": "You are a helpful AI assistant"},
    ]
})
```

#### Config Options

```ts
type Config = {
  favicon?: string  // Path to an SVG icon to display in browser tab, bookmarks, etc.
  title?: string  // Site title to display in browser tab, bookmarks, etc.
  logo_small?: string  // Path to an SVG icon to display in top right corner
  agent_name?: string  // Custom display name for the agent. Default 'Assistant'
  default_messages?: Array<OpenAIMessage>  // Messages to start each new conversation with
  prompt?: {
    allow_upload?: boolean  // Allow the user to upload images and files. Default true
    placeholder?: string  // Placeholder text. Default 'Send a message...'
  }
  functions: {
    [key: string]: {
      header?: {
        text?: string  // Customize the display text. Rendered as markdown
        show?: boolean  // Hide the header completely. No status indicator or display text
      },
      arguments?: {
        show_key_as_code?: {  // Show only the value of a specific key, as a code block
          key: string
          language: string
        },
        title?: string  // The text shown above arguments. Rendered as markdown
      },
      result?: {
        title?: string  // The text shown above result. Rendered as markdown.
        // If 'type' is passed, but is not one of these options, it's assumed to be
        // a language prefix (i.e. 'json'), and the result will be rendered as a code block
        type?: 'text' | 'markdown' | 'html' | string
      }
    }
  },
}
```


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
