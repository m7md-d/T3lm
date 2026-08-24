//go:build js && wasm

package main

import (
	"bytes"
	"syscall/js"

	"github.com/traefik/yaegi/interp"
	"gorunner/symbols"
	"github.com/traefik/yaegi/stdlib/unsafe"
)

func run(this js.Value, args []js.Value) any {
	src := args[0].String()
	var out, errb bytes.Buffer

	i := interp.New(interp.Options{Stdout: &out, Stderr: &errb, Unrestricted: true})
	/* رموزُ الحزم مقتطعة عمداً — الحزم التي يستعملها المنهج وحدها. انظر
	   symbols/README.md: الرزمة الكاملة تُخرج ملفاً لا ترفعه Cloudflare. */
	if err := i.Use(symbols.Symbols); err != nil {
		return res("", err.Error())
	}
	if err := i.Use(unsafe.Symbols); err != nil {
		return res("", err.Error())
	}

	/* Eval على مصدر فيه `func main` يشغّلها بنفسه — لا تُستدعى مرّة ثانية. */
	if _, err := i.Eval(src); err != nil {
		return res(out.String(), errb.String()+err.Error())
	}
	return res(out.String(), errb.String())
}

func res(stdout, stderr string) any {
	return map[string]any{"stdout": stdout, "stderr": stderr}
}

func main() {
	js.Global().Set("__goRun", js.FuncOf(run))
	select {}
}
