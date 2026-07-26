#!/usr/bin/env python3
"""Forward Stripe CLI events to local webhook; log full request/response bodies."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import urllib.request

FORWARD = os.environ.get("FORWARD_TO", "http://127.0.0.1:8787/api/billing/webhook")
LOG = os.environ.get("STRIPE_PROXY_LOG", "/tmp/stripe-proxy-evidence.jsonl")


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n)
        sig = self.headers.get("Stripe-Signature") or self.headers.get("stripe-signature") or ""
        req = urllib.request.Request(
            FORWARD,
            data=body,
            headers={
                "content-type": self.headers.get("Content-Type", "application/json"),
                "stripe-signature": sig,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_body = resp.read()
                status = resp.status
        except urllib.error.HTTPError as e:
            resp_body = e.read()
            status = e.code
        except Exception as e:
            resp_body = str(e).encode()
            status = 0

        record = {
            "forward": FORWARD,
            "req_bytes": len(body),
            "stripe_signature": sig[:120],
            "status": status,
            "response_body": resp_body.decode("utf-8", errors="replace"),
            "request_body_prefix": body[:200].decode("utf-8", errors="replace"),
        }
        with open(LOG, "a") as f:
            f.write(json.dumps(record) + "\n")
        print(json.dumps(record), flush=True)

        self.send_response(status if status else 502)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(resp_body)

    def log_message(self, *_args):
        pass


if __name__ == "__main__":
    port = int(os.environ.get("PROXY_PORT", "8798"))
    print(f"proxy listening on {port} -> {FORWARD} log={LOG}", flush=True)
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
