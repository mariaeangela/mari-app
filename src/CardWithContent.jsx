// Card de conteúdo do Explorar. Vive num arquivo próprio pra puxar o
// contentCards.js (~230 KB) só quando a Mari abre um tema — antes esse conteúdo
// todo vinha na abertura do app, mesmo pra ficar só na Tela Hoje.
//
// `type` controla a EXIBIÇÃO (rótulo, emoji, cor e id de salvamento);
// `contentType` controla de onde vem o CONTEÚDO. Para o slot "Cultura" eles
// diferem: exibe sempre "Cultura", mas o texto vem de cinema/artista/música/conexões.
import { useState } from 'react';
import ContentCard from './ContentCard.jsx';
import { CONTENT_TYPES, CARD_PALETTES } from './contentLibrary.js';
import { getCategoryDaily, getCategoryRandom } from './contentCards.js';

export default function CardWithContent({ type, offset = 0, tile = false, showReload = true }) {
  const info = CONTENT_TYPES.find(t => t.id === type);
  const palette = CARD_PALETTES[type] || CARD_PALETTES.texto;
  const [content, setContent] = useState(() => getCategoryDaily(type, offset));
  const reload = () => setContent(getCategoryRandom(type));
  return <ContentCard type={type} typeLabel={info?.label} typeEmoji={info?.emoji} palette={palette} content={content} onReload={showReload ? reload : undefined} tile={tile} />;
}
