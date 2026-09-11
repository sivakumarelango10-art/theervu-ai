import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from('todos').select();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Supabase Connection Test</h1>
        <p className="text-sm text-slate-500 mb-4">
          Querying table <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">todos</code>
        </p>
        <ul className="space-y-2">
          {todos && todos.length > 0 ? (
            todos.map((todo: { id: string | number; name: string }) => (
              <li key={todo.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-sm text-slate-800">
                {todo.name}
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-400 italic">No todos found or table not yet created in Supabase database.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
