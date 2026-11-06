import { vm } from 'jinge';
import { Button, Empty, Space } from 'jinge-antd';

export function EmptyExample() {
  const state = vm({ created: false });
  return (
    <Space direction="vertical" style="width:100%">
      {state.created ? (
        <div>
          <p role="status">已创建 1 条客户记录</p>
          <Button
            on:click={() => {
              state.created = false;
            }}
          >
            重新显示空态
          </Button>
        </div>
      ) : (
        <Empty description="暂无客户记录" announce>
          <Button
            type="primary"
            on:click={() => {
              state.created = true;
            }}
          >
            新建客户
          </Button>
        </Empty>
      )}
      <Empty
        size="sm"
        slot:image={
          <span
            className="icon-[ant-design--search-outlined] text-5xl text-slate-400"
            aria-hidden="true"
          />
        }
        slot:description={<span>没有匹配的结果，请调整搜索条件。</span>}
      />
      <Empty size="sm" image={false} description="也可以只保留文字，不展示插图。" />
    </Space>
  );
}
