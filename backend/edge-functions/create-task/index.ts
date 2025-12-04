// LearnLynk Tech Test - Task 3: Edge Function create-task

// Deno + Supabase Edge Functions style
// Docs reference: https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const { application_id, task_type, due_at } = body;

    // validation of application_id, task_type, due_at
    if(!application_id) {
      return new Response(JSON.stringify({ error: "Application id is requried" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    if(!task_type || !VALID_TYPES.includes(task_type)){
      return new Response(JSON.stringify({ error: "Invalid task type" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    if(!due_at || new Date(due_at) <= new Date()){
      return new Response(JSON.stringify({ error: "due_at must be a valid and future timestamp" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    // Inserting into tasks table
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        application_id,
        type: task_type,
        due_at
      })
      .select()
      .single();

    // return error if occurs
    if(error){
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // return success response
    return new Response(JSON.stringify({ success: true, task_id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
