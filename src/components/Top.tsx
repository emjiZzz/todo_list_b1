import { useNavigate } from 'react-router-dom';


const Top = () => {
  const navigate = useNavigate(); // Get the navigation function


  const goToTodos = () => {
    // You can also change the destination depending on conditions 
    navigate('/todos');
  };


  return (
    < div >
      < h1 > Homepage </ h1 >
      < button onClick={goToTodos} >
        Todo list
      </ button >
    </ div >
  );
};



export default Top;
export default Top;

