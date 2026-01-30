import list from './kisiler.json'
import keys from './keys.json'
import keyNames from './keyNames.json'
import 'bootstrap/dist/css/bootstrap.min.css';
import {Button} from 'react-bootstrap'

import SpinningCornerImage from './SpinningCornerImage';

const printStyles = `

    .no-print {
      display: none !important;
    }


  .profileName {
    font-size: 22px;
    font-family: "Lato", sans-serif;
    font-weight: 900;
    font-style: normal;
    margin-top: 10px;
    margin-bottom: 10px
  }

  .main {
    margin: 0px;
    padding: 0px;
    text-align: center;
  }

  .mobileShow {
    display: none;
  }

  .contactButtons {
    display: none;
  }

  .profileImage {
    max-width: 200px;
    max-height: 300px;
    border: 1px solid #000000;
  }

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

  @media screen and (max-width: 767px) and (orientation: portrait) {

    .profileName {
      font-size: 16px;
      font-family: "Lato", sans-serif;
      font-weight: 900;
      font-style: normal;
      margin-top: 5px;
      margin-bottom: 5px
    }

    .menu {
      position: fixed;
      bottom: 0;
    }

    .profileImage {
      max-width: 100px;
      max-height: 200px;
      border: 1px solid #000000;
    }


    .no-print {
      max-width: 100px
    }

    .webShow {
      display: none !important;
    }

    .mobileShow {
      display: inline;
    }

    .contactButtons {
      display: flex;
      justify-content: space-evenly;
      margin-top: 20px
    }
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

    .contactButtons {
      display: none !important;
    }
  }
`;

function App() {

  const reOrdered = () => {
    const ordered = list.sort((a, b) => parseInt(a.matrikul) > parseInt(b.matrikul))
    console.log(ordered)
    return ordered
  }

  const onMailClick = (mail) => {
    console.log(mail)
    window.location.href = "mailto:"+mail
  }

  const onPhoneClick = (phone) => {
    console.log(phone)
    window.location.href = "tel:0"+phone
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main">
      <style>{printStyles}</style>
      <SpinningCornerImage src="./olive.png" size={200} speed={0.1} />
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
        <span className='webShow'>PDF Olarak Kaydet</span>
        <span className='mobileShow'>PDF</span>
      </button>
      {
        reOrdered()
        .map(p =>
          <div key={p.matrikul} className="full-page-item" style={{
            minHeight: '100vh', // En az bir ekran boyu yer kapla
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Dikeyde tam ortaya getir
            padding: '10px',
            borderBottom: '1px dashed #ccc', // Ekranda ayrımı görmek için
            boxSizing: 'border-box'
          }}>
            <div>
              <img 
                className='profileImage'
                alt={p.adSoyad}
                src={"https://idaimages.blob.core.windows.net/matrikul/"+p.matrikul+".jpg"} 
              />
            </div>
            <div className='profileName'>{p.adSoyad}</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr', // 1. sütun içeriğe göre, 2. sütun kalan boşluğa göre
              gap: '5px', // Sütunlar arası boşluk,
              alignItems: 'start',
              fontSize: 18
            }}>
              {
                keys.map(key => {
                  return (
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
                  )
                  }
                )
              }
            </div>
            <div className='contactButtons'>
              <Button variant='primary' onClick={(e) => {
                    e.preventDefault()
                    onPhoneClick(p["tlfGsmEvIs"])
              }}>Telefon Et</Button>
              <Button variant='success' onClick={(e) => {
                    e.preventDefault()
                    window.location.href = "https://wa.me/90"+p["tlfGsmEvIs"]
              }}>Whatsapp Yaz</Button>
              <Button variant='warning' onClick={(e) => {
                    e.preventDefault()
                    onMailClick(p["ePosta"])
              }}>Email Gönder</Button>
            </div>
          </div>
        )
      }
    </div>
  );
}

export default App;
