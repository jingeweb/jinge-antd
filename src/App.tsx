import { JNode, Props, vm } from "jinge";

function A(props: Props<{
  props: { n: number, },
  slots: {
    a: JNode;
  },
  children: JNode;
  events: {
    click: (...args: any[]) => void
  }
}>) {
  return <div>
    {props.children}
    <button on:click={props["on:click"]} >TTT</button>
  </div>
}

// export function FormField(props: Props<{
//   props: {
//     required?: boolean;
//     className?: string;
//     labelClassName?: string;
//     error?: string;
//   },
//   children?: JNode,
//   slots: {
//     label: JNode
//   }
// }>) {

//   return (
//     <div >
//       <label >
//         <span className='relative'>
//           {props.required && <span className='absolute -left-2 top-[1px] text-base text-red-500'>*</span>}
//           {props["slot:label"]}
//         </span>
//       </label>
//       <div

//       >
//         {props.children}
//         {props.error && <p className='text-error text-xs'>{props.error}</p>}
//       </div>
//     </div>
//   );
// };

export function App() {

  return <A n={10} slot:a="x" on:click={() => console.log('cc')} >H</A>

}