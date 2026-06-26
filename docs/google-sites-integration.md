# Google Sites integration for vkrglobal.net

Google Sites is suitable as the marketing/front-end shell. The poll app should remain hosted on Netlify at `https://miplanr.com` because Google Sites cannot run Netlify Functions or a Supabase backend directly.

## Option A: Button link
1. Open your Google Site editor.
2. Go to the miPlanr page or homepage.
3. Insert → Button.
4. Button text: `Create a miPlanr Poll`.
5. Link: `https://miplanr.com/index.html`.
6. Publish.

## Option B: Embed
1. Insert → Embed.
2. Choose `By URL`.
3. Paste `https://miplanr.com/index.html`.
4. Insert and resize the iframe block.
5. Publish.

## Recommended
Use a hero button first. Embeds can work, but some browsers and security settings may make embedded apps feel cramped.
