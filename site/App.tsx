import { LoadingOutlined } from '../src';
import { vm } from 'jinge';

export function App() {
  const state = vm({
    k: 'c',
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
      {/* {state.n >= 11 && state.n <= 12 && <p><A /></p>} */}
      {/* <Dynamic fc={x[state.k]} /> */}

      <p className='p-40'>
        {/* <Popconfirm title='确认删除XXX吗？' placement='top-end' on:confirm={() => {
          return new Promise((res) => {
            setTimeout(() => res(true), 3000)
          })
        }} >
          <button
          >
            TEST
          </button>
        </Popconfirm> */}
        <button
          on:click={() => {
            // state.n++;
            state.k = state.k === 'b' ? 'a' : state.k === 'c' ? 'b' : 'c';
          }}
        >
          TEST
        </button>
      </p>
      <div className='p-36'></div>
    </div>
  );
}
