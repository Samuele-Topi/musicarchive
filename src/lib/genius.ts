
const BASE_URL = 'https://api.genius.com';

export async function searchArtistOnGenius(artistName: string) {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) {
    console.warn("GENIUS_ACCESS_TOKEN is missing");
    return null;
  }

  try {
    // 1. Search for the artist
    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(artistName)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!searchRes.ok) throw new Error(`Genius Search Failed: ${searchRes.statusText}`);
    
    const searchData = await searchRes.json();
    const hit = searchData.response.hits.find((h: any) => 
      h.type === 'song' && h.result.primary_artist.name.toLowerCase().includes(artistName.toLowerCase())
    );

    // If we found a song, use its primary artist. 
    // Alternatively, Genius API has no direct "Search Artist" endpoint, usually you search songs and get artist from there,
    // OR valid ID. But let's try to get the artist object directly if we can get an ID.
    
    // Better approach: hits return songs. Get primary_artist from the top hit.
    if (!hit) return null;

    const artistId = hit.result.primary_artist.id;
    
    // 2. Fetch Artist Details
    const artistUrl = `${BASE_URL}/artists/${artistId}`;
    const artistRes = await fetch(artistUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!artistRes.ok) throw new Error(`Genius Artist Fetch Failed: ${artistRes.statusText}`);

    const artistData = await artistRes.json();
    const artist = artistData.response.artist;

    return {
      imageUrl: artist.image_url,
      bio: artist.description?.plain || "", // Genius returns bio in 'dom' or 'plain'
      name: artist.name
    };

  } catch (error) {
    console.error(`Error fetching data for ${artistName} from Genius:`, error);
    return null;
  }
}
