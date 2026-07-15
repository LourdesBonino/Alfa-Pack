import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oezibeqbtqhvqhpmqycc.supabase.co';
const supabaseKey = 'sb_publishable_fxHu1929gdglh18AByr_OQ_r9DkVnyc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() { 
    const clienteId = '32f0100e-80c0-4dfd-a74a-c40cc653288b'; // Lourdes Bonino
    const mesAnio = '2026-07';
    const startDate = `${mesAnio}-01`;
    const endYear = parseInt(mesAnio.split('-')[0]);
    const endMonth = parseInt(mesAnio.split('-')[1]);
    const nextMonthDate = new Date(endYear, endMonth, 1);
    const endDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes!pedidos_cliente_id_fkey(*)')
        .or(`cliente_id.eq.${clienteId},destinatario_id.eq.${clienteId}`)
        .gte('fecha_registro', startDate)
        .lt('fecha_registro', endDate)
        .order('fecha_registro', { ascending: true });
        
    console.log('Data length:', data?.length); 
    if (error) console.log('Error:', error); 
} 
test();
