const universities = [
  { id: 1, name: "Aix-Marseille Université", desc: "Marseille, France", image: "https://madeinmarseille.net/actualites-marseille/2019/04/Cube-campus-aix.jpeg" },
  { id: 2, name: "Université Bordeaux-Montaigne", desc: "Bordeaux, France", image: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Ijba_iut_montaigne_bordeaux.jpg" },
  { id: 3, name: "Université de Franche-Comté", desc: "Besançon, France", image: "https://cdn-s-www.bienpublic.com/images/AC513A2C-88A9-456D-972D-758F6975A8A9/NW_raw/le-campus-dijonnais-de-l-universite-de-bourgogne-accueille-plus-de-30-000-etudiants-photo-d-illustration-lbp-emma-buoncristiani-1690820597.jpg" },
  { id: 4, name: "Université Jean-Monnet-Saint-Étienne", desc: "Loire, France", image: "https://www.univ-st-etienne.fr/_richText-file/ametys-internal%253Asites/ujm/ametys-internal%253Acontents/plans-d-acces-2/_attribute/content/_data/Campus-Trefilerie-Pierre-Grasset.jpg" },
  { id: 5, name: "Université de Nîmes", desc: "Nîmes, France", image: "https://upload.wikimedia.org/wikipedia/commons/1/16/Scines_nimes.jpg" },
  { id: 6, name: "Université Rennes 2", desc: "Rennes, France", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg/330px-Batiments_de_nuits_-Univ_Rennes_2_-_Louis_Arretche.jpg" },
];

export default function Home({ onSelectUni }) {
  return (
    <div className="home-header">
      <h1 className="home-title">Welcome back, Kateryna</h1>
      <p className="home-desc">Discover design and art universities with Unexa. Everything you need in one place</p>
      <div className="home-search-row">
        <div className="home-search">
          <input type="text" placeholder="Search ......" className="home-search-input" />
          <img src="/search-normal.svg" alt="" className="home-search-icon-svg" />
        </div>
        <div className="home-icon-buttons">
          <button className="home-icon-btn">
            <img src="/filter.svg" alt="Filter" />
          </button>
          <button className="home-icon-btn">
            <img src="/notification.svg" alt="Notifications" />
          </button>
        </div>
      </div>

      <div className="uni-grid">
        {universities.map(uni => (
          <div
            key={uni.id}
            className="uni-card-new"
            onClick={() => onSelectUni(uni)}
          >
            <img src={uni.image} alt={uni.name} className="uni-card-img" />
            <div className="uni-card-glass">
              <div className="uni-card-glass-blur" />
              <div className="uni-card-text">
                <div className="uni-card-title">{uni.name}</div>
                <div className="uni-card-subtitle">{uni.desc}</div>
              </div>
              <button className="uni-card-save">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Home;