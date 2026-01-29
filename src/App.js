import './App.css';
import list from './kisiler.json'
import keys from './keys.json'
import keyNames from './keyNames.json'

const printStyles = `

  body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background-image: url("https://idaimages.blob.core.windows.net/matrikul/gonye.png"); /* görsel yolu */
      background-repeat: no-repeat;
      background-position: center center;
      background-size: contain;        /* ekranı tamamen kaplar */
      background-attachment: fixed;  /* scroll ile hareket etmez */
    }


  @media print {
    /* Yazdırırken sayfa kenar boşluklarını sıfırla (isteğe bağlı) */

    * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    @page {
      size: auto;
      margin: 0mm;
    }    
    
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background-repeat: repeat;
      background-size: cover;        /* ekranı tamamen kaplar */
      background-attachment: fixed;  /* scroll ile hareket etmez */
    }

    html { 
      background: none !important;   /* ÇİFT BASMA sebebi çoğu zaman bu */
    }

    .link {
      text-decoration: none;
      color: #000000
    }
    
    /* Her kartın kendinden sonra asdads yeni sayfa başlatmasını sağlar */
    .full-page-item {
      page-break-after: always; /* Eski tarayıcılar için */
      break-after: page;        /* Modern tarayıcılar için */
      height: 100vh;            /* Tam sayfa yüksekliği */
      display: flex;            /* İçeriği ortalamak için */
      flex-direction: column;
      justify-content: center;  /* Dikeyde ortala */

      /* Yazdırırken kenarlık ve boşlukları temizle */
      border: none !important; 
      margin: 10 !important;
      padding: 10 !important;
    }
    
    /* Son elemandan sonra boş sayfa çıkmasını engellemek için */
    .full-page-item:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .no-print {
      display: none !important;
    }
  }
`;

function App() {

  const reOrdered = () => {
    const ordered = list.sort((a, b) => parseInt(a.matrikul) < parseInt(b.matrikul))
    console.log(ordered)
    return ordered
  }

  const onMailClick = (mail) => {
    console.log(mail)
    window.location.href = "mailto:"+mail
  }

  const onPhoneClick = (phone) => {
    console.log(phone)
    window.location.href = "phone:"+phone
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="App">
      <style>{printStyles}</style>
      <button
        className="no-print" // Bu sınıf sayesinde PDF'te çıkmayacak
        onClick={handlePrint}
        style={{
          position: 'fixed', // Sayfa kaydırılsa bile sabit kalır
          top: '20px',       // Üstten mesafe
          right: '20px',     // Sağdan mesafe
          zIndex: 9999,      // Diğer öğelerin üstünde dursun
          padding: '12px 24px',
          backgroundColor: '#e74c3c', // Kırmızımsı renk
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          fontSize: '16px'
        }}
      >
        📄 PDF Olarak Kaydet
      </button>
      {
        reOrdered()
        .map(p =>
          <div className="full-page-item" style={{
            minHeight: '100vh', // En az bir ekran boyu yer kapla
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Dikeyde tam ortaya getir
            padding: '40px',
            borderBottom: '1px dashed #ccc', // Ekranda ayrımı görmek için
            boxSizing: 'border-box'
          }}>
            <div>
              <img 
                alt={p.adSoyad}
                src={"https://idaimages.blob.core.windows.net/matrikul/"+p.matrikul+".jpg"} 
                style={{
                  maxWidth: 200,
                  maxHeight: 300,
                  border: "1px solid #000000",
                }}
                />
            </div>
            <div className='lato-black' style={{
              fontSize: 22
            }}>{p.adSoyad}</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr', // 1. sütun içeriğe göre, 2. sütun kalan boşluğa göre
              gap: '10px', // Sütunlar arası boşluk,
              alignItems: 'start',
              fontSize: 18
            }}>
              {
                keys.map(key => {
                  if (key === 'ePosta') { 
                    return (
                    <>
                      <div className='lato-bold' style={{
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}>{keyNames[key]}:</div>
                      <div style={{
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}>
                        <a className='link' href='/deneme' onClick={(e) => {
                          e.preventDefault();
                          onMailClick(p[key]);
                        }}>{p[key]}</a>
                      </div>
                  </>
                  )} else if (key === 'tlfGsmEvIs') { 
                    return (
                    <>
                      <div className='lato-bold' style={{
                        textAlign: 'left',
                        whiteSpace: 'nowrap'
                      }}>{keyNames[key]}:</div>
                      <div style={{
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}>
                        <a className='link' href='/deneme' onClick={(e) => {
                          e.preventDefault();
                          onPhoneClick(p[key]);
                        }}>{p[key]}</a>
                      </div>
                  </>
                  )} else { return (
                    <>
                      <div className='lato-bold' style={{
                        textAlign: 'left',
                        whiteSpace: 'nowrap'
                      }}>{keyNames[key]}:</div>
                      <div className='lato-regular' style={{
                        textAlign: 'left',
                        whiteSpace: 'nowrap'
                      }}>{p[key]}</div>
                  </>
                  )}
                  }
                )
              }
            </div>
          </div>
        )
      }
    </div>
  );
}

export default App;
