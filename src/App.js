import './App.css';
import list from './kisiler.json'
import keys from './keys.json'

const printStyles = `
  @media print {
    /* Yazdırırken sayfa kenar boşluklarını sıfırla (isteğe bağlı) */
    @page {
      size: auto;
      margin: 0mm;
    }    
    
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
    
    /* Her kartın kendinden sonra yeni sayfa başlatmasını sağlar */
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
        list.map(p =>
          <div className="full-page-item" style={{
            minHeight: '100vh', // En az bir ekran boyu yer kapla
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Dikeyde tam ortaya getir
            padding: '40px',
            borderBottom: '1px dashed #ccc', // Ekranda ayrımı görmek için
            boxSizing: 'border-box'
          }}>
            <div>{p.adSoyad}</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr', // 1. sütun içeriğe göre, 2. sütun kalan boşluğa göre
              gap: '10px', // Sütunlar arası boşluk,
              alignItems: 'start'
            }}>
              {
                keys.map(key =>
                  <>
                    <div style={{
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>{key}:</div>
                    <div style={{
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>{p[key]}</div>
                  </>
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
