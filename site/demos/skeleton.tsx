import { vm } from 'jinge';
import { Button, Skeleton, SkeletonBlock, Space } from 'jinge-antd';

export function SkeletonExample() {
  const state = vm({ loading: true });
  return (
    <Space direction="vertical" style="width:100%">
      <Button
        on:click={() => {
          state.loading = !state.loading;
        }}
      >
        切换骨架加载
      </Button>
      <Skeleton loading={state.loading} active avatar rows={3} widths={['100%', '85%', '60%']}>
        <label>
          已加载内容 <input aria-label="骨架区域备注" placeholder="再次加载时保留输入" />
        </label>
      </Skeleton>
      <Space wrap>
        <SkeletonBlock width={80} height={32} shape="round" />
        <SkeletonBlock width={180} height={32} />
        <SkeletonBlock width={96} height={72} active />
      </Space>
    </Space>
  );
}
