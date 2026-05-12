import { Button, modal } from 'jinge-antd';

export function App() {
  async function mock() {
    modal.show({ title: 'TEST', content: 'hello' });
  }
  return (
    <div className="h-140 w-100 overflow-scroll pt-10">
      <div className="h-200 w-200 pt-100 pl-20">
        <Button on:click={() => mock()}>HOVER ME</Button>
      </div>
      <canvas
        id="debug-canvas"
        className="pointer-events-none fixed top-0 left-0 h-screen w-screen select-none"
      />
    </div>
  );
}
