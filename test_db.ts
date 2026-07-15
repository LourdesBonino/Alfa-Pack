import { supabase } from './src/lib/supabase'; 
async function test() { 
    const {data, error} = await supabase.from('pedidos').select('id, cliente_id, fecha_registro, fecha_ejecucion').limit(5); 
    console.log('Data:', data); 
    console.log('Error:', error); 
} 
test();
