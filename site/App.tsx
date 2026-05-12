import { Button, Popover } from 'jinge-antd';

export function App() {
  return (
    <div className="pt-10">
      <Popover
        on:openChange={(v) => {
          console.log('open changed', v);
        }}
        slot:content={<div className="p-3">hello, it's me</div>}
      >
        <Button>HOVER ME</Button>
      </Popover>
    </div>
  );
}
