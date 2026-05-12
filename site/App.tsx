import { Button, Popover } from 'jinge-antd';

export function App() {
  return (
    <div className="h-140 w-100 overflow-scroll pt-10">
      <div className="h-200 w-200 pt-100 pl-20">
        <Popover
          on:openChange={(v) => {
            console.log('open changed', v);
          }}
          triggerMethod="hover"
          safePolygon
          placement="right-start"
          slot:content={<div className="p-30">hello, it's me</div>}
        >
          <Button>HOVER ME</Button>
        </Popover>
      </div>
    </div>
  );
}
