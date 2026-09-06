import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("pixel_settings").select("*").order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pixels: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, pixel_id, is_active, conversion_token, custom_events_config } = body;

    if (!platform) {
      return NextResponse.json({ error: "Plataforma é obrigatória" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("pixel_settings")
      .upsert(
        {
          platform,
          name: platform === 'meta' ? 'Meta Pixel (Facebook/Instagram Ads)' :
                platform === 'gtm' ? 'Google Tag Manager (GTM)' :
                platform === 'tiktok' ? 'TikTok Pixel' : 'Google Ads Conversion Tag',
          pixel_id: pixel_id || "",
          is_active: Boolean(is_active),
          conversion_token: conversion_token || "",
          custom_events_config: custom_events_config || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pixel: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
