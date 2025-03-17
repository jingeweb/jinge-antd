import { vm } from "jinge";
import { Popover } from "./components/popover";

export function App() {
  const state = vm({
    open: false
  });
  let tm = 0;
  return (
    <div>
      <div className="p-36"></div>
      <div className="p-10">
        <Popover on:openChange={(v) => {
          state.open = v;
          clearTimeout(tm);
        }} open={state.open} placement="top" slot:trigger={<button className="relative">TEST</button>} >Hello, World</Popover>
      </div>
      <p>
        <button on:click={() => {
          if (state.open === false) {
            state.open = true;
            tm = window.setTimeout(() => {
              state.open = false;
              tm = 0;
            }, 3000);
          }
        }}>TTT</button>
      </p>
      <div className="p-36"></div>
    </div>
  );
}
