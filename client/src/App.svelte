<script lang="ts">
import { onMount } from 'svelte';
import {
    Socket,
    createDarkModeStore,
    Chat,
    type SerializedChat,
} from './lib/core';
import { debounce, localStorageGet, localStorageSet } from './lib/util';

let ChatComponent: any;

onMount(async () => {
    ChatComponent = (await import('./components/Chat.svelte')).default;
})

const PROD = true;

const BASE_URL = PROD ? '' : 'http://127.0.0.1:5004';

const socket = new Socket(BASE_URL, { transports: ['websocket'] });
socket.on("connect", () => console.log("CONNECTED"));

const darkMode = createDarkModeStore();
const chat = new Chat(socket);

const existingChat = localStorageGet<SerializedChat>('chat');
if (existingChat) {
    chat.setFromSerialized(existingChat);
}


const saveState = debounce(() => {
    setTimeout(() => {
        localStorageSet('chat', chat.serialize());
    })
}, 500);

chat.messages.subscribe(saveState);
chat.prompt.files.subscribe(saveState);
chat.prompt.images.subscribe(saveState);
chat.prompt.text.subscribe(saveState);
chat.errors.subscribe(saveState);
chat.config.subscribe(saveState);


// chat.handleSetAllEvent([
//     {
//         "role": "user",
//         "content": "In Python, how do you execute a string as code and record the printed output?",
//     },
//     {
//         "role": "assistant",
//         "content": "To execute a string as code and record the output, you can use the `exec` function in combination with `io.StringIO` to capture the standard output (stdout). Here's how you could do it:\n\n```python\nimport io\nimport contextlib\n\ndef code(code_str: str):\n    # Create a string buffer to capture output\n    with io.StringIO() as buf, contextlib.redirect_stdout(buf):\n        # Run the code, using an empty dictionary for globals and locals\n        exec(code_str, {}, {})\n        # Get the output from the buffer\n        output = buf.getvalue()\n    return output\n```\n\nThis function takes a string of code as input, executes it, and returns whatever was printed to stdout during its execution.",
//     },
//     {
//         "role": "user",
//         "content": "Can you test this code and show me the output?",
//     },
//     {
//         "role": "assistant",
//         "content": null,
//         "tool_calls": [
//             {
//                 'id': '1',
//                 'type': 'function',
//                 'function': {
//                     'name': 'run_python',
//                     'arguments': '{"code": "import io\\nimport contextlib\\n\\ndef code(code_str: str):\\n    with io.StringIO() as buf, contextlib.redirect_stdout(buf):\\n        exec(code_str, {}, {})\\n        output = buf.getvalue()\\n    return output\\n\\n# Testing the function\\ntest_code = \\"print(\'Hello, World!\')\\"\\noutput = code(test_code)\\noutput"}',
//                 }
//             }
//         ]
//     },
//     {
//         "role": "tool",
//         "content": "'Hello, World!'",
//         "tool_call_id": "1",
//     },
//     {
//         "role": "assistant",
//         "content": "The output of the test code `print('Hello, World!')` is `'Hello, World!'`. The function successfully captures and returns the printed output.",
//     },
//     {
//         "role": "user",
//         "content": "When using exec(), what does the locals argument do? Can you demonstrate?",
//     },
//     {
//         "role": "assistant",
//         "content": "If you don't pass an empty dictionary for the `locals` parameter in the `exec` function, Python will use the local scope where `exec` is called. This means the code executed by `exec` can read and modify the local variables of the function where `exec` is being called.\n\nFor example:",
//         "tool_calls": [
//             {
//                 "id": "2",
//                 "type": "function",
//                 "function": {
//                     "name": "run_python",
//                     "arguments": '{"code": "def code(code_str: str):\\n    local_var = [1, 2]\\n    exec(code_str)\\n    return local_var\\n\\n# If the executed code modifies `local_var`\\nprint(code(\\"local_var.append(3)\\"))  # This will print \'[1, 2, 3]\'\\n"}',
//                 }
//             }
//         ]
//     },
//     {
//         "role": "tool",
//         "content": "[1, 2, 3]",
//         "tool_call_id": "2",
//     },
//     {
//         "role": "assistant",
//         "content": "In this example, the string of code passed to `exec` changes the value of `local_var`. Because we didn't provide a separate local environment for `exec`, it directly affects the variables in the `code` function's local scope. This can lead to unintended side effects and is generally considered unsafe, especially if the code being executed is not trusted.",
//     },
//     {
//         "role": "user",
//         "content": "Can you query the number of netflix users by country, subscription type, device and gender?",
//     },
//     {
//         "role": "assistant",
//         "content": "Sure, let me find the number of Netflix users by country, subscription type, device and gender:",
//         "tool_calls": [
//             {
//                 "id": "3",
//                 "type": "function",
//                 "function": {
//                     "name": "query_sql",
//                     "arguments": '{"q": "SELECT [Subscription Type], \\n       COUNT([User ID]) AS [User Count], \\n       Device, \\n       Gender, \\n       Country \\nFROM df \\nGROUP BY Country, \\n         [Subscription Type], \\n         Device, \\n         Gender"}',
//                 }
//             }
//         ]
//     },
//     {
//         "role": "tool",
//         "content": '|     | Subscription Type   |   User Count | Device     | Gender   | Country        |\n|----:|:--------------------|-------------:|:-----------|:---------|:---------------|\n|   0 | Basic               |            4 | Laptop     | Female   | Australia      |\n|   1 | Basic               |            4 | Laptop     | Male     | Australia      |\n|   2 | Basic               |            2 | Smart TV   | Female   | Australia      |\n|   3 | Basic               |            3 | Smart TV   | Male     | Australia      |\n|   4 | Basic               |            5 | Smartphone | Female   | Australia      |\n|   5 | Basic               |            6 | Smartphone | Male     | Australia      |\n|   6 | Basic               |            5 | Tablet     | Female   | Australia      |\n|   7 | Basic               |            2 | Tablet     | Male     | Australia      |\n|   8 | Premium             |           13 | Laptop     | Female   | Australia      |\n|   9 | Premium             |           12 | Laptop     | Male     | Australia      |\n|  10 | Premium             |            7 | Smart TV   | Female   | Australia      |\n|  11 | Premium             |           18 | Smart TV   | Male     | Australia      |\n|  12 | Premium             |           16 | Smartphone | Female   | Australia      |\n|  13 | Premium             |           13 | Smartphone | Male     | Australia      |\n|  14 | Premium             |            9 | Tablet     | Female   | Australia      |\n|  15 | Premium             |           13 | Tablet     | Male     | Australia      |\n|  16 | Standard            |           10 | Laptop     | Female   | Australia      |\n|  17 | Standard            |            4 | Laptop     | Male     | Australia      |\n|  18 | Standard            |            4 | Smart TV   | Female   | Australia      |\n|  19 | Standard            |            4 | Smart TV   | Male     | Australia      |\n|  20 | Standard            |            7 | Smartphone | Female   | Australia      |\n|  21 | Standard            |            8 | Smartphone | Male     | Australia      |\n|  22 | Standard            |            7 | Tablet     | Female   | Australia      |\n|  23 | Standard            |            7 | Tablet     | Male     | Australia      |\n|  24 | Basic               |           22 | Laptop     | Female   | Brazil         |\n|  25 | Basic               |           16 | Laptop     | Male     | Brazil         |\n|  26 | Basic               |           13 | Smart TV   | Female   | Brazil         |\n|  27 | Basic               |           21 | Smart TV   | Male     | Brazil         |\n|  28 | Basic               |           23 | Smartphone | Female   | Brazil         |\n|  29 | Basic               |           20 | Smartphone | Male     | Brazil         |\n|  30 | Basic               |           20 | Tablet     | Female   | Brazil         |\n|  31 | Basic               |           11 | Tablet     | Male     | Brazil         |\n|  32 | Premium             |            2 | Laptop     | Female   | Brazil         |\n|  33 | Premium             |            3 | Laptop     | Male     | Brazil         |\n|  34 | Premium             |            1 | Smart TV   | Female   | Brazil         |\n|  35 | Premium             |            3 | Smart TV   | Male     | Brazil         |\n|  36 | Premium             |            6 | Smartphone | Female   | Brazil         |\n|  37 | Premium             |            6 | Smartphone | Male     | Brazil         |\n|  38 | Premium             |            7 | Tablet     | Female   | Brazil         |\n|  39 | Premium             |            5 | Tablet     | Male     | Brazil         |\n|  40 | Standard            |            1 | Laptop     | Male     | Brazil         |\n|  41 | Standard            |            1 | Smart TV   | Female   | Brazil         |\n|  42 | Standard            |            1 | Smart TV   | Male     | Brazil         |\n|  43 | Standard            |            1 | Tablet     | Male     | Brazil         |\n|  44 | Basic               |           17 | Laptop     | Female   | Canada         |\n|  45 | Basic               |           13 | Laptop     | Male     | Canada         |\n|  46 | Basic               |           16 | Smart TV   | Female   | Canada         |\n|  47 | Basic               |           24 | Smart TV   | Male     | Canada         |\n|  48 | Basic               |           13 | Smartphone | Female   | Canada         |\n|  49 | Basic               |           21 | Smartphone | Male     | Canada         |\n|  50 | Basic               |           22 | Tablet     | Female   | Canada         |\n|  51 | Basic               |           19 | Tablet     | Male     | Canada         |\n|  52 | Premium             |            7 | Laptop     | Female   | Canada         |\n|  53 | Premium             |           10 | Laptop     | Male     | Canada         |\n|  54 | Premium             |            9 | Smart TV   | Female   | Canada         |\n|  55 | Premium             |           11 | Smart TV   | Male     | Canada         |\n|  56 | Premium             |            8 | Smartphone | Female   | Canada         |\n|  57 | Premium             |           11 | Smartphone | Male     | Canada         |\n|  58 | Premium             |           16 | Tablet     | Female   | Canada         |\n|  59 | Premium             |           16 | Tablet     | Male     | Canada         |\n|  60 | Standard            |           11 | Laptop     | Female   | Canada         |\n|  61 | Standard            |            6 | Laptop     | Male     | Canada         |\n|  62 | Standard            |           10 | Smart TV   | Female   | Canada         |\n|  63 | Standard            |            8 | Smart TV   | Male     | Canada         |\n|  64 | Standard            |           15 | Smartphone | Female   | Canada         |\n|  65 | Standard            |           12 | Smartphone | Male     | Canada         |\n|  66 | Standard            |           13 | Tablet     | Female   | Canada         |\n|  67 | Standard            |            9 | Tablet     | Male     | Canada         |\n|  68 | Basic               |            9 | Laptop     | Female   | France         |\n|  69 | Basic               |            2 | Laptop     | Male     | France         |\n|  70 | Basic               |            2 | Smart TV   | Female   | France         |\n|  71 | Basic               |            5 | Smart TV   | Male     | France         |\n|  72 | Basic               |            5 | Smartphone | Female   | France         |\n|  73 | Basic               |            3 | Smartphone | Male     | France         |\n|  74 | Basic               |            1 | Tablet     | Female   | France         |\n|  75 | Basic               |            9 | Tablet     | Male     | France         |\n|  76 | Premium             |           20 | Laptop     | Female   | France         |\n|  77 | Premium             |           21 | Laptop     | Male     | France         |\n|  78 | Premium             |           23 | Smart TV   | Female   | France         |\n|  79 | Premium             |           13 | Smart TV   | Male     | France         |\n|  80 | Premium             |           19 | Smartphone | Female   | France         |\n|  81 | Premium             |           20 | Smartphone | Male     | France         |\n|  82 | Premium             |           12 | Tablet     | Female   | France         |\n|  83 | Premium             |           19 | Tablet     | Male     | France         |\n|  84 | Basic               |           22 | Laptop     | Female   | Germany        |\n|  85 | Basic               |           29 | Laptop     | Male     | Germany        |\n|  86 | Basic               |           20 | Smart TV   | Female   | Germany        |\n|  87 | Basic               |           11 | Smart TV   | Male     | Germany        |\n|  88 | Basic               |           16 | Smartphone | Female   | Germany        |\n|  89 | Basic               |           14 | Smartphone | Male     | Germany        |\n|  90 | Basic               |           22 | Tablet     | Female   | Germany        |\n|  91 | Basic               |           15 | Tablet     | Male     | Germany        |\n|  92 | Premium             |            1 | Laptop     | Female   | Germany        |\n|  93 | Premium             |            1 | Laptop     | Male     | Germany        |\n|  94 | Premium             |            1 | Smartphone | Male     | Germany        |\n|  95 | Standard            |            4 | Laptop     | Female   | Germany        |\n|  96 | Standard            |            6 | Laptop     | Male     | Germany        |\n|  97 | Standard            |            6 | Smart TV   | Female   | Germany        |\n|  98 | Standard            |            5 | Smart TV   | Male     | Germany        |\n|  99 | Standard            |            1 | Smartphone | Female   | Germany        |\n| 100 | Standard            |            4 | Smartphone | Male     | Germany        |\n| 101 | Standard            |            2 | Tablet     | Female   | Germany        |\n| 102 | Standard            |            3 | Tablet     | Male     | Germany        |\n| 103 | Basic               |           19 | Laptop     | Female   | Italy          |\n| 104 | Basic               |           30 | Laptop     | Male     | Italy          |\n| 105 | Basic               |           29 | Smart TV   | Female   | Italy          |\n| 106 | Basic               |           15 | Smart TV   | Male     | Italy          |\n| 107 | Basic               |           18 | Smartphone | Female   | Italy          |\n| 108 | Basic               |           25 | Smartphone | Male     | Italy          |\n| 109 | Basic               |           20 | Tablet     | Female   | Italy          |\n| 110 | Basic               |           20 | Tablet     | Male     | Italy          |\n| 111 | Premium             |            2 | Smart TV   | Female   | Italy          |\n| 112 | Premium             |            1 | Smartphone | Female   | Italy          |\n| 113 | Premium             |            1 | Smartphone | Male     | Italy          |\n| 114 | Standard            |            1 | Laptop     | Female   | Italy          |\n| 115 | Standard            |            1 | Smartphone | Female   | Italy          |\n| 116 | Standard            |            1 | Smartphone | Male     | Italy          |\n| 117 | Basic               |            1 | Laptop     | Female   | Mexico         |\n| 118 | Basic               |            1 | Smart TV   | Male     | Mexico         |\n| 119 | Basic               |            1 | Smartphone | Female   | Mexico         |\n| 120 | Basic               |            1 | Tablet     | Male     | Mexico         |\n| 121 | Standard            |           21 | Laptop     | Female   | Mexico         |\n| 122 | Standard            |           22 | Laptop     | Male     | Mexico         |\n| 123 | Standard            |           22 | Smart TV   | Female   | Mexico         |\n| 124 | Standard            |           18 | Smart TV   | Male     | Mexico         |\n| 125 | Standard            |           20 | Smartphone | Female   | Mexico         |\n| 126 | Standard            |           25 | Smartphone | Male     | Mexico         |\n| 127 | Standard            |           24 | Tablet     | Female   | Mexico         |\n| 128 | Standard            |           27 | Tablet     | Male     | Mexico         |\n| 129 | Basic               |           13 | Laptop     | Female   | Spain          |\n| 130 | Basic               |           10 | Laptop     | Male     | Spain          |\n| 131 | Basic               |            9 | Smart TV   | Female   | Spain          |\n| 132 | Basic               |           13 | Smart TV   | Male     | Spain          |\n| 133 | Basic               |           17 | Smartphone | Female   | Spain          |\n| 134 | Basic               |           12 | Smartphone | Male     | Spain          |\n| 135 | Basic               |           21 | Tablet     | Female   | Spain          |\n| 136 | Basic               |           15 | Tablet     | Male     | Spain          |\n| 137 | Premium             |           32 | Laptop     | Female   | Spain          |\n| 138 | Premium             |           21 | Laptop     | Male     | Spain          |\n| 139 | Premium             |           37 | Smart TV   | Female   | Spain          |\n| 140 | Premium             |           30 | Smart TV   | Male     | Spain          |\n| 141 | Premium             |           20 | Smartphone | Female   | Spain          |\n| 142 | Premium             |           21 | Smartphone | Male     | Spain          |\n| 143 | Premium             |           24 | Tablet     | Female   | Spain          |\n| 144 | Premium             |           27 | Tablet     | Male     | Spain          |\n| 145 | Standard            |           11 | Laptop     | Female   | Spain          |\n| 146 | Standard            |           20 | Laptop     | Male     | Spain          |\n| 147 | Standard            |           17 | Smart TV   | Female   | Spain          |\n| 148 | Standard            |           20 | Smart TV   | Male     | Spain          |\n| 149 | Standard            |           12 | Smartphone | Female   | Spain          |\n| 150 | Standard            |           20 | Smartphone | Male     | Spain          |\n| 151 | Standard            |           20 | Tablet     | Female   | Spain          |\n| 152 | Standard            |            9 | Tablet     | Male     | Spain          |\n| 153 | Basic               |            1 | Smart TV   | Female   | United Kingdom |\n| 154 | Basic               |            1 | Smart TV   | Male     | United Kingdom |\n| 155 | Basic               |            1 | Smartphone | Female   | United Kingdom |\n| 156 | Standard            |           22 | Laptop     | Female   | United Kingdom |\n| 157 | Standard            |           22 | Laptop     | Male     | United Kingdom |\n| 158 | Standard            |           15 | Smart TV   | Female   | United Kingdom |\n| 159 | Standard            |           23 | Smart TV   | Male     | United Kingdom |\n| 160 | Standard            |           26 | Smartphone | Female   | United Kingdom |\n| 161 | Standard            |           27 | Smartphone | Male     | United Kingdom |\n| 162 | Standard            |           28 | Tablet     | Female   | United Kingdom |\n| 163 | Standard            |           17 | Tablet     | Male     | United Kingdom |\n| 164 | Basic               |           29 | Laptop     | Female   | United States  |\n| 165 | Basic               |           19 | Laptop     | Male     | United States  |\n| 166 | Basic               |           28 | Smart TV   | Female   | United States  |\n| 167 | Basic               |           24 | Smart TV   | Male     | United States  |\n| 168 | Basic               |           25 | Smartphone | Female   | United States  |\n| 169 | Basic               |           26 | Smartphone | Male     | United States  |\n| 170 | Basic               |           21 | Tablet     | Female   | United States  |\n| 171 | Basic               |           27 | Tablet     | Male     | United States  |\n| 172 | Premium             |           27 | Laptop     | Female   | United States  |\n| 173 | Premium             |           22 | Laptop     | Male     | United States  |\n| 174 | Premium             |           16 | Smart TV   | Female   | United States  |\n| 175 | Premium             |           18 | Smart TV   | Male     | United States  |\n| 176 | Premium             |           12 | Smartphone | Female   | United States  |\n| 177 | Premium             |           16 | Smartphone | Male     | United States  |\n| 178 | Premium             |           17 | Tablet     | Female   | United States  |\n| 179 | Premium             |           17 | Tablet     | Male     | United States  |\n| 180 | Standard            |           11 | Laptop     | Female   | United States  |\n| 181 | Standard            |           13 | Laptop     | Male     | United States  |\n| 182 | Standard            |           15 | Smart TV   | Female   | United States  |\n| 183 | Standard            |           15 | Smart TV   | Male     | United States  |\n| 184 | Standard            |           12 | Smartphone | Female   | United States  |\n| 185 | Standard            |            8 | Smartphone | Male     | United States  |\n| 186 | Standard            |           12 | Tablet     | Female   | United States  |\n| 187 | Standard            |           21 | Tablet     | Male     | United States  |',
//         "tool_call_id": "3",
//     },
//     {
//         "role": "assistant",
//         "content": "Here's the query you asked for. Let me know how else I can help.",
//     },
//     {
//         "role": "user",
//         "content": "Can you make a chart with this data?",
//     },
//     {
//         "role": "assistant",
//         "content": "Sure, here's a plotly chart of the data:",
//         "tool_calls": [
//             {
//                 "id": "5",
//                 "type": "function",
//                 "function": {
//                     "name": "create_plotly_chart",
//                     "arguments": '',
//                 }
//             }
//         ]
//     },
//     {
//         "role": "tool",
//         "content": '<img src="" />',
//         "tool_call_id": "5",
//     },
//     {
//         "role": "assistant",
//         "content": "Let me know how else I can help.",
//     },
//     {
//         "role": "user",
//         "content": "Can you execute a test Cypher query against a hypothetical Neo4j database?",
//     },
//     {
//         "role": "assistant",
//         "content": "Sure. Here's an example Cypher query for a hypothetical Neo4j graph database:",
//         "tool_calls": [
//             {
//                 "id": "4",
//                 "type": "function",
//                 "function": {
//                     "name": "query_neo4j",
//                     "arguments": '{"q": "MATCH (p:Person)-[r:KNOWS]->(f:Person)\\nWHERE p.name = \'Alice\'\\nRETURN f.name, r.since"}',
//                 }
//             }
//
//         ]
//     },
//     {
//         "role": "tool",
//         'content': "| Friend's Name | Known Since |\n|---------------|-------------|\n| Bob           | 2012        |\n| Charlie       | 2015        |\n| Eve           | 2018        |\n| David         | 2013        |",
//         'tool_call_id': '4',
//     },
//     {
//         'role': "assistant",
//         'content': "This query finds all `Person` nodes directly connected to the `Person` node named 'Alice' through a `KNOWS` relationship. It returns the names of these people and the 'since' property of the `KNOWS` relationship, which presumably represents how long Alice has known these people."
//     }
// ])
//
// chat.config.setAll({
//     "functions": {
//         "run_python": {
//             "arguments": {
//                 "show_key_as_code": {
//                     "key": "code",
//                     "language": "python",
//                 },
//                 "title": "Code Interpreter &nbsp; | &nbsp; **Python**",
//             },
//             "header": {
//                 "show": false,
//             }
//         },
//         "query_sql": {
//             "result": {
//                 "type": "markdown",
//                 "title": "Query Results",
//             },
//             "arguments": {
//                 "show_key_as_code": {
//                     "key": "q",
//                     "language": "sql",
//                 },
//                 "title": "SQL Query",
//             },
//             "header": {
//                 "text": "Fetching data ...",
//                 "show": true,
//             }
//         },
//         "query_neo4j": {
//             "result": {
//                 "type": "markdown",
//                 "title": "Query Results",
//             },
//             "arguments": {
//                 "show_key_as_code": {
//                     "key": "q",
//                     "language": "sql",
//                 },
//                 "title": "Cypher Query &nbsp; | &nbsp; **Neo4j**",
//             },
//             "header": {
//                 "text": "Fetching data from Knowledge Graph ...",
//                 "show": true,
//             }
//         }
//     },
//     "agent": {
//         "name": "Assistant",
//     },
// })





// chat.handleSetAllEvent([
//     {
//         "role": "user",
//         "content": "When using exec(), what does the locals argument do? Can you demonstrate?",
//     },
//     {
//         "role": "assistant",
//         "content": "If you don't pass an empty dictionary for the `locals` parameter in the `exec` function, Python will use the local scope where `exec` is called. This means the code executed by `exec` can read and modify the local variables of the function where `exec` is being called.\n\nFor example:",
//         "tool_calls": [
//             {
//                 "id": "1",
//                 "type": "function",
//                 "function": {
//                     "name": "run_python",
//                     "arguments": '{"code": "def code(code_str: str):\\n    local_var = [1, 2]\\n    exec(code_str)\\n    return local_var\\n\\n# If the executed code modifies `local_var`\\nprint(code(\\"local_var.append(3)\\"))  # This will print \'[1, 2, 3]\'\\n"}',
//                 }
//             }
//         ]
//     },
//     {
//         "role": "tool",
//         "content": "[1, 2, 3]",
//         "tool_call_id": "1",
//     },
//     {
//         "role": "assistant",
//         "content": "In this example, the string of code passed to `exec` changes the value of `local_var`. Because we didn't provide a separate local environment for `exec`, it directly affects the variables in the `code` function's local scope. This can lead to unintended side effects and is generally considered unsafe, especially if the code being executed is not trusted.",
//     }
// ])
//
// chat.config.set({
//     "functions": {
//         "run_python": {
//             "arguments": {
//                 "show_key_as_code": {
//                     "key": "code",
//                     "language": "python",
//                 },
//                 "title": "Code Interpreter &nbsp; | &nbsp; **Python**",
//             },
//             "header": {
//                 "show": false,
//             }
//         }
//     },
//     "agent": {
//         "name": "Code Helper",
//     }
// })


// chat.handleSetAllEvent([
//     {
//         role: 'assistant',
//         content: null,
//         tool_calls: [
//             {
//                 id: '1',
//                 type: 'function',
//                 function: {
//                     name: 'run_python',
//                     arguments: '{"code": "print(1)\\nx = [1 for _ in range(5)]"}'
//                 }
//             }
//         ]
//     },
//     {
//         role: 'tool',
//         content: '{"one": "two"}',
//         tool_call_id: '1',
//     }
// ])
//
// chat.config.set({
//     "functions": {
//         "run_python": {
//             "arguments": {
//                 "show_key_as_code": {
//                     "key": "code",
//                     "language": "python",
//                 },
//                 title: 'Code Interpreter &nbsp; | &nbsp; **Python**',
//             },
//             "result": {
//                 // "type": "html",
//             },
//             header: {
//                 show: false,
//             }
//         }
//     }
// })

</script>

<svelte:component this={ChatComponent} {chat}/>
