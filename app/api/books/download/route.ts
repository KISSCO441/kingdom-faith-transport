import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime="nodejs";
export async function GET(request:NextRequest){
 const token=request.nextUrl.searchParams.get("token")||"";
 if(!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({error:"This download link is invalid."},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return NextResponse.json({error:"Downloads are temporarily unavailable."},{status:503});
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:order,error}=await supabase.from("kfm_book_orders").select("id,book_id,payment_status,download_expires_at,download_count").eq("download_token",token).maybeSingle();
 if(error||!order||order.payment_status!=="PAID") return NextResponse.json({error:"A verified purchase is required for this download."},{status:403});
 if(!order.download_expires_at||new Date(order.download_expires_at).getTime()<Date.now()) return NextResponse.json({error:"This download link has expired. Please contact KFM for assistance."},{status:410});
 if(order.download_count>=5) return NextResponse.json({error:"The maximum number of downloads has been reached. Please contact KFM for assistance."},{status:429});
 const {data:book,error:bookError}=await supabase.from("kfm_books").select("title,file_path").eq("id",order.book_id).maybeSingle();
 if(bookError||!book) return NextResponse.json({error:"The book file could not be found."},{status:404});
 const {data:updated,error:updateError}=await supabase.from("kfm_book_orders").update({download_count:order.download_count+1}).eq("id",order.id).eq("download_count",order.download_count).select("id").maybeSingle();
 if(updateError||!updated) return NextResponse.json({error:"Please try the download again."},{status:409});
 const {data:signed,error:signedError}=await supabase.storage.from("kfm-digital-books").createSignedUrl(book.file_path,60,{download:`${book.title.replace(/[^a-z0-9-_ ]/gi,"").slice(0,100)}.pdf`});
 if(signedError||!signed?.signedUrl) return NextResponse.json({error:"The download could not be prepared."},{status:500});
 return NextResponse.redirect(signed.signedUrl);
}
