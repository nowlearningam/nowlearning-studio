# Now Learning Studio

Make videos for Now Learning.

**Shorts** (vertical 1080×1920): **How To Use It** (steps with screenshots and tap highlights), **Quick Discovery** (one feature in 20–40 seconds) and **Festival Wishes**. The first two end on the Now Learning Card (Tool · Use it for · Cost).
**Long video** (16:9 1920×1080): **How To Use It** (a full tutorial, one step per chapter), **Quick Discovery** (one tool, several of its features) and **Tool Roundup** (many tools, one feature each). All three end on the Now Learning Card.

```
npm install
npm run dev      # open the printed localhost address in Chrome, Edge or Brave
npm run build    # production build in dist/
npm test
```

1. Choose **Shorts** or **Long video**, then pick **Start from one of 30 ideas** (or a template), fill in the fields and upload screenshots.
2. Choose a **Colour template** (Apps mint, AI violet, Tricks yellow, Websites sky, One tool coral, Daylight light) and the language of the on-screen labels (English, தமிழ், हिन्दी).
3. Preview, scrub, then **Export** an MP4 (offline on computers and iOS 26+, real-time recording on older iPhones). **Save project** downloads a JSON with your media.

Deploy: Vercel with build `npm run build` and output `dist`. Commit every new file.
