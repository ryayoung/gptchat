import os
import time
import mimetypes
import werkzeug
from zlib import adler32
from typing import cast
from flask import Response
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class StaticResponse:
    data: bytes
    mimetype: str
    headers: dict[str, str]
    size: int
    max_age: int | None = None

    def get_response(self, **kwargs) -> Response:
        rv = Response(self.data, mimetype=self.mimetype, headers=self.headers, **kwargs)
        rv.content_length = self.size
        return rv

    def prepare_conditional_response(self, request_environ: dict, **kwargs) -> Response:
        rv = self.get_response(**kwargs)
        if self.max_age:
            rv.headers['Expires'] = werkzeug.http.http_date(time.time() + self.max_age)
        rv = rv.make_conditional(request_environ, accept_ranges=True, complete_length=rv.content_length)
        return cast(Response, rv)


def make_static_response(full_path: str, data: bytes, cache_max_age: int | None = None) -> StaticResponse:
    stat = os.stat(full_path)
    size = stat.st_size
    mtime = stat.st_mtime
    headers = {}

    download_name = os.path.basename(full_path)

    mimetype, encoding = mimetypes.guess_type(download_name)
    mimetype = mimetype or 'application/octet-stream'
    headers['Content-Length'] = str(size)
    if encoding:
        headers['Content-Encoding'] = encoding

    if full_path.endswith(".gz"):
        download_name = download_name[:-3]  # for Safari

    headers['Content-Disposition'] = f'inline; filename="{download_name}"'
    headers['Last-Modified'] = werkzeug.http.http_date(mtime)

    check = adler32(data) & 0xFFFFFFFF
    headers['ETag'] = f"{mtime}-{size}-{check}"

    headers['Cache-Control'] = f'max-age={cache_max_age}, public' if cache_max_age else 'no-cache, must-revalidate'

    return StaticResponse(data, mimetype, headers, size, cache_max_age)


def get_relative_static_file_names(static_folder: str) -> list[str]:
    file_names = []
    for root, dirs, files in os.walk(static_folder):
        for file in files:
            full_path = os.path.join(root, file)
            relative_path = os.path.relpath(full_path, static_folder)
            file_names.append(relative_path)
    return file_names


def get_static_responses_from_dir(static_folder: str, max_age: int) -> dict[str, StaticResponse]:
    file_names = get_relative_static_file_names(static_folder)

    res: dict[str, StaticResponse] = {}
    for fname in file_names:
        full_path = os.path.join(static_folder, fname)

        with open(full_path, 'rb') as f:
            data = f.read()

        cache_max_age = None if "index.html" in fname else max_age

        res[fname] = make_static_response(full_path, data, cache_max_age)

    return res


def get_filename_target(available_names: dict | set | list, filename: str, accept_encoding: str) -> str | None:
    if 'br' in accept_encoding and filename + '.br' in available_names:
        return filename + '.br'
    if 'gzip' in accept_encoding and filename + '.gz' in available_names:
        return filename + '.gz'
    if filename in available_names:
        return filename
    return None
