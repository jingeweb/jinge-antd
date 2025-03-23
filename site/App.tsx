// import { modal } from '../src/modal';
import { LoadingOutlined } from '@/loading';
import { message } from '@/message';
import { modal } from '@/modal';
import { onModalConfirm } from '@/modal/modal';
import { Popconfirm } from '@/popconfirm';
import { vm } from 'jinge';

function A() {
  onModalConfirm(() => {
    return new Promise((res) => {
      setTimeout(() => res(false), 3000);
    });
  });
  return (
    <div>
      <p>Form Content22222</p>
    </div>
  );
}

export function App() {
  const state = vm({
    n: 10,
  });
  // setInterval(() => {
  //   state.n++;
  // }, 1000);

  // async function showM() {
  //   const modalInstance = modal.show({
  //     title: 'TEST',
  //     'slot:content': (
  //       <>
  //         <p>Hello, World {state.n}</p>
  //         <div>

  //           <button on:click={state.t}>OPEN</button>
  //         </div>
  //       </>
  //     ),
  //     // content: 'hhh',
  //     'on:afterClose': () => {
  //       console.info('after close');
  //     },
  //   });
  //   await modalInstance.waitForClose();
  //   console.info('after close 2');
  // }

  // watch(state, 'k', (v) => {
  //   console.log(v);
  // })

  return (
    <div className='pt-10'>
      <LoadingOutlined />
      {state.n}
      <p className='p-40'>
        <Popconfirm title='确认删除XXX吗？' placement='top-end' on:confirm={() => {
          return new Promise((res) => {
            setTimeout(() => res(true), 3000)
          })
        }} >
          <button
          >
            TEST
          </button>
        </Popconfirm>
      </p>
      <div className='p-36'></div>
    </div>
  );
}
