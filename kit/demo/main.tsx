import { createRoot } from 'react-dom/client';
import { Runner, javascriptRuntime, createGoRuntime } from '../src/editor/index';
import '../src/styles/reset.css';
import './tokens.css';              /* هوية المنهج — مصدر الحقيقة */
import '../src/editor/editor.css';
import '../src/editor/derive.css';      /* المحرّر يرث تلك الهوية */
import '../src/terminal/terminal.css';
import '../src/terminal/derive.css';    /* والطرفية كذلك */

const GO = `package main

import "fmt"

func main() {
	nums := []int{3, 1, 2}
	for i, n := range nums {
		fmt.Println(i, n)
	}
}`;

createRoot(document.getElementById('root')!).render(
  <div style={{ maxWidth: 760, margin: '2rem auto', display: 'grid', gap: '2rem' }}>
    <Runner initial={GO} lang="go" filename="main.go"
      runtime={createGoRuntime()} fallback={{ label: 'Playground ↗', href: 'https://go.dev/play/' }} />
    <Runner initial={"const xs = [3,1,2];\nconsole.log(xs.sort());"} lang="javascript"
      filename="main.js" runtime={javascriptRuntime} useTabs={false} tabSize={2} />
  </div>
);
