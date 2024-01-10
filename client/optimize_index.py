import os
from glob import glob
from bs4 import BeautifulSoup

static_path = os.path.join('..', 'package', 'static')
index_path = os.path.join(static_path, 'index.html')
assets_dir = os.path.join(static_path, 'assets')

with open(index_path, 'r') as f:
    index_html = f.read()


files = glob(os.path.join(assets_dir, '*'))

js_files = ['/assets/' + os.path.basename(f) for f in files if f.endswith(".js")]
css_files = ['/assets/' + os.path.basename(f) for f in files if f.endswith(".css")]

index_js = [f for f in js_files if 'index' in f][0]
js_files = [f for f in js_files if 'index' not in f]



soup = BeautifulSoup(index_html, 'html.parser')

head = soup.head
assert head is not None, 'head was not found'
for script in head.find_all('script'):
    script.decompose()

for link in head.find_all('link', {'rel': 'stylesheet'}):
    link.decompose()

link_tag = soup.new_tag('link', rel='modulepreload', href=index_js)
head.append(link_tag)

# Append modulepreload for other js files
for js_file in js_files:
    link_tag = soup.new_tag('link', rel='modulepreload', href=js_file)
    head.append(link_tag)

# Append links for CSS files
for css_file in css_files:
    link_tag = soup.new_tag('link', rel='stylesheet', href=css_file)
    head.append(link_tag)

body = soup.body
assert body is not None, 'body was not found'

# Append script tag for index.js at the end of <body>
script_tag = soup.new_tag('script', type='module', crossorigin=None, src=index_js)
body.append(script_tag)

updated_html = str(soup.prettify())

print("Previous index.html...")
print(index_html)
print("Optimized index.html...")
print(updated_html)


with open(index_path, 'w') as f:
    f.write(updated_html)
