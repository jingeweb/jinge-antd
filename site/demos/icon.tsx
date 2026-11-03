import {
  Space,
  AntDesignCheckCircleFilled,
  AntDesignInfoCircleFilled,
  AntDesignCloseCircleFilled,
  LoadingOutlined,
} from 'jinge-antd';

export function IconExample() {
  return (
    <Space size="lg">
      <AntDesignCheckCircleFilled size={24} color="#389e0d" ariaLabel="成功" />
      <AntDesignInfoCircleFilled size={24} color="#1677ff" ariaLabel="信息" />
      <AntDesignCloseCircleFilled size={24} color="#ff4d4f" ariaLabel="失败" />
      <LoadingOutlined style="font-size:24px" ariaLabel="正在加载" />
    </Space>
  );
}
