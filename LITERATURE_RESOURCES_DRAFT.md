# Kestirimci Bakım Literatürü — Kaynaklar ve Genel Çıkarımlar

Bu doküman, bu proje boyunca (staj dönemi + PHM2010/C-MAPSS/IMS Bearing portfolyo
çalışmaları) incelenen makalelerden çıkarılan **genellenebilir** dersleri özetler.
Amaç, belirli bir veri setine özgü sonuçları değil, herhangi bir kestirimci bakım
projesine taşınabilecek metodolojik/kavramsal dersleri bir araya getirmektir.

---

## 1. Coble & Hines (2009) — Prognostik Parametre Seçimi (MTP Çerçevesi)

**Kaynak:** Coble, J., & Hines, J. W. (2009). *Identifying Optimal Prognostic
Parameters from Data: A Genetic Algorithms Approach.* Annual Conference of the
PHM Society, 1(1).
https://papers.phmsociety.org/index.php/phmconf/article/view/1404

**Ne öneriyor:** Bir sensör özelliğinin RUL tahmininde kullanılmaya değer olup
olmadığını üç ayrı metrikle test etmeyi öneriyor: **Monotonicity** (özellik zamanla
tutarlı bir yönde mi değişiyor, yoksa rastgele mi salınıyor), **Trendability**
(farklı birimlerdeki eğri **aynı şekli** paylaşıyor mu), **Prognosability**
(farklı birimlerin arıza anındaki değerleri birbirine ne kadar yakın).

**Genel çıkarım:** Bu üçlü ayrım, PHM literatüründe sıkça karıştırılan iki farklı
soruyu netleştiriyor: *"Bu özellik birimin kendi içinde anlamlı mı"* ile *"Bu
özellik birimler arasında karşılaştırılabilir mi"* aynı şey değil. Bir özellik tek
bir birimde mükemmel bir trend gösterebilir (yüksek monotonicity) ama farklı
birimlerde tamamen farklı davranabilir (düşük trendability) — bu durumda o özellik
**o birime özel bir teşhis aracı** olabilir ama **genellenebilir bir RUL öngörücüsü**
olamaz. Herhangi bir projede özellik seçimi yaparken, "bu özellik hangi birimde iyi
çalışıyor" sorusunu "bu özellik genelde iyi çalışıyor mu" sorusundan ayırmak gerekir.

---

## 2. Li et al. (2023) — Çok-Örüntülü Wiener Süreci ile RUL Tahmini

**Ne öneriyor:** Bozulmayı, sabit bir sürüklenme (drift) parametresine sahip bir
Wiener stokastik süreci olarak modelleyip, gözlemlenen veriye en iyi uyan
sürüklenme örüntüsünü (birden fazla aday arasından) DTW (Dynamic Time Warping)
uygunluk skoruyla seçiyor.

**Genel çıkarım:** Wiener süreci ailesi (ve genel olarak stokastik süreç tabanlı
RUL modelleri), **tek yönlü ve nispeten düzenli bir bozulma** varsayımına
dayanıyor — bu varsayım ihlal edildiğinde (sinyal bazen artıp bazen azalıyorsa,
ya da birimler arasında bozulma yönü tutarsızsa), bu ailenin tüm üyeleri
(M1/M2/M3 varyantları dahil) zayıf kalıyor. Bu, bir projeye başlamadan önce
**"benim sinyalim gerçekten tek yönlü mü"** sorusunu erken ve açıkça test etmenin
(basit bir monotonluk/yön-tutarlılığı kontrolüyle) zaman kazandırdığını gösteriyor —
aksi halde bu tür bir model ailesine yatırım yapıp sonradan temel varsayımın
geçersiz olduğunu keşfetmek riski var.

---

## 3. Küçükdağ et al. (2026) — Ridge-Regularize Edilmiş HMM ile RUL Kestirimi

**Kaynak:** Küçükdağ, H. B., Kirkil, G., & Hekimoğlu, M. (2026). *Robust
HMM-Based Remaining Useful Life Estimation Using a Ridge-Regularized EM
Algorithm.* Sensors, 26(4), 1321. https://doi.org/10.3390/s26041321

**Ne öneriyor:** Gizli Markov Modeli (HMM) tabanlı RUL tahmininde, özellikle
**küçük eğitim filosunda** (N=50 gibi) parametre kestirimini kararlılaştırmak için
ridge regularizasyonu ve Huber-robust varyans kestirimi kullanıyor; RUL'u,
absorbing duruma beklenen geçiş süresi olarak hesaplıyor.

**Genel çıkarım:** Bu makale, PHM literatüründe az konuşulan önemli bir noktaya
işaret ediyor: **standart (regularize edilmemiş) istatistiksel modeller, küçük
filo büyüklüğünde (n<100 gibi) parametre kararsızlığına çok duyarlı** —
regularizasyon, sadece "overfitting'i önleme" tekniği değil, küçük-n rejiminde
**modelin tamamen anlamsız durumlara savrulmasını** önleyen bir gereklilik haline
geliyor. Ayrıca Huber-robust kayıp fonksiyonunun, ani/aşırı sensör sıçramalarını
otomatik olarak "daha az güvenilir" sayması, gürültülü endüstriyel sensör
verisiyle çalışırken genel olarak faydalı bir tasarım ilkesi.

---

## 4. Airao et al. (2026, Wear 600) — Bayesian Neural Network ile Takım RUL Tahmini

**Kaynak:** Airao, J., Fattahi, S., Truong, T. T., Alinaghizadeh, A.,
Azarhoushang, B., Karras, P., & Aghababaei, R. (2026). *Data driven tool wear
and remaining useful tool life estimation.* Wear, 600, 206808.
https://doi.org/10.1016/j.wear.2026.206808 (açık erişim:
https://www.sciencedirect.com/science/article/pii/S004316482600298X)

**Ne öneriyor:** Takım aşınması ve RUL tahmini için BNN kullanıp, modelin
tahminine ek olarak bir **belirsizlik (uncertainty) skoru** da ürettiğini iddia
ediyor.

**Genel çıkarım (eleştirel okumadan):** Bu makale, literatürdeki "belirsizlik
nicelemesi" iddialarının **her zaman gerçek bir Bayesian posterior dağılımına
dayanmadığını** göstermesi açısından öğretici — incelemede kullanılan yöntemin
aslında **post-hoc duyarlılık analizi** (girdiyi hafifçe değiştirip çıktının ne
kadar değiştiğine bakmak) olduğu, gerçek bir olasılıksal belirsizlik tahmini
olmadığı görüldü. Genel ders: bir makale "belirsizlik/güven aralığı" iddia
ettiğinde, bunun **gerçekten olasılıksal bir çıkarım** mı yoksa **dolaylı bir
duyarlılık ölçümü** mü olduğunu ayırt etmek önemli — ikisi çok farklı garantiler
sunuyor, biri kalibre bir olasılık dağılımıyken diğeri sadece "bu tahmin ne kadar
hassas" sorusuna kaba bir cevap.

---

## 5. Wang, Yu, Siegel, Lee (2008) — Benzerlik Tabanlı Prognostik Yaklaşım

**Kaynak:** Wang, T., Yu, J., Siegel, D., & Lee, J. (2008). *A Similarity-Based
Prognostics Approach for Remaining Useful Life Estimation of Engineered
Systems.* 2008 International Conference on Prognostics and Health Management,
1-6. https://doi.org/10.1109/PHM.2008.4711421 (açık erişim:
https://www.academia.edu/14007977/)

**Ne öneriyor:** 2008 PHM Data Challenge'ı kazanan, alanın kurucu makalelerinden
biri — yeni bir birimin erken dönem trajectory'sini, geçmişte gözlemlenmiş **tam
ömür trajectory'leriyle** karşılaştırıp, en çok benzeyenlerin RUL'una göre
ağırlıklı bir tahmin üretiyor.

**Genel çıkarım:** Benzerlik-tabanlı yaklaşımların temel ön koşulu, **geçmiş
trajectory kütüphanesinin yeterince zengin ve tutarlı** olması — yani bu aile,
dolaylı olarak "geçmiş birimler birbirine yeterince benziyor" varsayımına dayanıyor.
Bu, MTP çerçevesindeki "trendability" kavramıyla doğrudan ilişkili: düşük
trendability'ye sahip bir veri setinde (birimler birbirinden çok farklı şekillerde
bozuluyorsa), benzerlik-tabanlı yöntemler yapısal olarak dezavantajlı kalır —
"benzer" bir geçmiş trajectory bulmak mümkün olmayabilir.

---

## 6. Soons, Dijkman, Jilderda, Duivesteijn (2020) — TBSP ve Bayesian Güncelleme

**Kaynak:** Soons, Y., Dijkman, R., Jilderda, S., & Duivesteijn, W. (2020).
*Predicting Remaining Useful Life with Similarity-Based Priors.* İçinde
konferans bildirisi serisi (Springer).
https://link.springer.com/chapter/10.1007/978-3-030-44584-3_38

**Ne öneriyor:** Trajectory-Based Similarity Prediction (TBSP) — benzerlik
tabanlı tahmini, yeni gözlem geldikçe **Bayesian olarak güncellenen** bir
tahminle birleştiriyor.

**Genel çıkarım:** Bayesian güncelleme katmanı, teorik olarak zarif bir fikir
(zaman içinde daha fazla veri geldikçe tahminin güvenilirliğinin artması) — ama
**temel benzerlik varsayımı zayıfsa** (bkz. madde 5), üzerine eklenen Bayesian
katman bunu telafi edemiyor; "daha akıllı bir güncelleme mekanizması", "temelde
zayıf bir sinyali" güçlü hale getirmiyor. Bu, genel bir prensip: bir modelin
üzerine eklenen sofistike bir katman (ensemble, Bayesian güncelleme, vs.), ancak
altındaki temel sinyal gerçekten varsa fayda sağlar — sinyal yoksa, karmaşıklık
sadece "daha karmaşık bir şekilde yanlış" olmaya yol açar.

---

## 7. Li, Zheng, Xiang, Liu, Wan (2025) — Mode-Dependent RVM + Benzerlik Ensemble

**Kaynak:** Li, N., Zheng, J., Xiang, D., Liu, Z., & Wan, Y. (2025). *Remaining
useful life prediction with limited run-to-failure data: A Bayesian ensemble
approach combining mode-dependent RVM and similarity.*
https://www.sciencedirect.com/science/article/pii/S0019057824005342

**Ne öneriyor:** Çok az run-to-failure verisiyle (11-16 örnek) çalışabilen bir
yöntem — birimleri önce "mod"lara (örn. K-means ile) ayırıp, her mod için ayrı bir
Relevance Vector Machine + benzerlik ensemble'ı kuruyor.

**Genel çıkarım:** "Az veriyle çalışabilir" iddia eden yöntemlerin, genelde
**veriyi alt gruplara bölerek** (mode-dependent) daha da azaltıyor olabileceğine
dikkat etmek gerekiyor — bu, kağıt üzerinde "n=16 ile çalışıyor" desin, gerçekte
her alt-mod içinde n çok daha küçük kalabilir. Bir yöntemin "küçük veriyle
çalıştığı" iddiasını değerlendirirken, o yöntemin **iç modelleme adımlarının**
veriyi ne kadar daha da böldüğünü kontrol etmek önemli.

---

## 8. Yang, Ji, Li (2026) — Çok-Rotalı Benzerlik Ensemble (PHME 2026)

**Kaynak:** Yang, K.-L., Ji, D.-Y., & Li, Y.-H. (2026). *A Similarity-Based
Ensemble Framework for Remaining Useful Life Prediction.* PHM Society European
Conference. https://papers.phmsociety.org/index.php/phme/article/view/4986

**Ne öneriyor:** Birden fazla "rota" (farklı benzerlik ölçütü/model kombinasyonu)
kullanıp, bunların tahminlerini ensemble ile birleştiren güncel bir yaklaşım.

**Genel çıkarım:** Ensemble yaklaşımlar, tekil bir yöntemin zayıflığını **rastgele
gürültü söz konusu olduğunda** azaltabilir, ama **sistematik bir zayıflığı**
(örneğin tüm rotaların aynı temel benzerlik varsayımına dayanması) çözemez. Genel
ders: ensemble kurarken, bileşenlerin **birbirinden bağımsız hata modlarına**
sahip olduğundan emin olmak gerekir — aksi halde ensemble, "aynı hatayı N kez
tekrarlayan" bir yapıya dönüşür, gerçek bir çeşitlilik sağlamaz.

---

## 9. Li et al. (2026, Materials) — Fizik-Temelli Akım Baseline Modeli

**Ne öneriyor:** Kesme geometrisinden (malzeme genişliği vb.) "beklenen akım"
değerini fiziksel/analitik olarak hesaplayıp, gerçek akımın bu beklenen değerden
sapmasını (residual) aşınma sinyali olarak kullanıyor.

**Genel çıkarım:** Fizik-temelli bir baseline kurmak (saf veri-güdümlü bir model
yerine), sensör verisindeki **operasyonel değişkenliği** (farklı kesim
koşullarının doğal olarak yarattığı akım/güç farkını) modelden ayıklamanın etkili
bir yolu olabilir — ham sinyal yerine "beklenenden sapma" kullanmak, genel olarak
gürültüyü azaltan sağlam bir teknik. Ama bu yaklaşımın gücü, **fiziksel modelin
doğruluğuna** bağımlı — model çok basitse (örn. sadece bir değişkenle, malzeme
genişliğiyle), gerçek operasyonel karmaşıklığı yakalayamayıp sapma sinyalini
kendisi de gürültülü hale getirebilir.

---

## 10. ExxonMobil Research (2020) — Intelligent Maintenance Çerçevesi

**Kaynak:** ExxonMobil Research and Engineering (2020). *Advancing from
Predictive Maintenance to Intelligent Maintenance with AI and IIoT.*
arXiv:2009.00351. https://arxiv.org/abs/2009.00351

**Ne öneriyor:** Bakımın tarihsel gelişimini (reaktif → önleyici → kestirimci →
reçeteli) beşinci bir aşamayla ("Intelligent Maintenance") genişletiyor: olasılıksal
makine öğrenmesi, gerçek zamanlı IIoT ağları, büyük veri altyapısı, sürekli model
güncelleme (CI/CD mantığıyla), sahada mobil/AR destekli karar verme.

**Genel çıkarım:** Bu çerçevenin en değerli tarafı, kestirimci bakımı **tek bir
model kurma işi olarak değil, sürekli güncellenen bir sistem** olarak
konumlandırması. Pratikte bu şu anlama geliyor: bir kestirimci bakım projesinin
başarısı, tek seferlik yüksek bir model doğruluğuyla değil, modelin **zaman
içinde yeni verilerle yeniden kalibre edilebilme kapasitesiyle** ölçülmeli — özellikle
küçük n ile başlayan projelerde (ki çoğu gerçek endüstriyel proje böyle başlar),
"bugünkü model zayıf ama sistem büyüdükçe güçlenecek" perspektifi, "bugünkü model
mükemmel olmalı" beklentisinden daha gerçekçi ve daha sürdürülebilir.

---

## 11. Peng et al. (2025, MSSP) — Çok-Ölçekli Zaman-Frekans Bilgisiyle RUL Tahmini

**Kaynak:** Peng, C., Zheng, J., Chen, T., Shi, Y., Guo, L., Jing, Z., & Wang,
Z. (2026). *A novel tool wear and remaining useful life prediction network
based on multi-scale time–frequency information of milling force.* Mechanical
Systems and Signal Processing, 244, 113763.
https://doi.org/10.1016/j.ymssp.2025.113763

**Ne öneriyor:** Kesme kuvveti sinyalini Senkron-Yeniden-Atama Dönüşümü (SRT) ile
zaman-frekans uzayına taşıyıp, mil dönüş frekansı ve harmoniklerine odaklanan
(Multi-Frequency Focusing) bir sıkıştırma yapıyor, sonra DenseNet+SE tabanlı bir
derin ağla RUL tahmin ediyor.

**Genel çıkarım:** Bu makale, **ham zaman-domeni istatistiklerinin** (ortalama,
std gibi) genelde birbirine yakın frekans bantlarındaki farklı fiziksel
olguları (örn. farklı arıza tiplerinin farklı harmonik imzalarını) ayırt
edemediğini, ama **doğru frekans-domeni dönüşümünün** bunu başarabileceğini
gösteriyor. Genel ders: bir sinyalin "zayıf" göründüğü bir istatistik/temsilde
başarısız olmak, sinyalin gerçekten yok olduğu anlamına gelmez — doğru dönüşüm
(FFT, zarf analizi, dalgacık, vs.) altında aynı sinyal çok daha net ortaya
çıkabilir. Ama bu dönüşümün **veri çözünürlüğü** (örnekleme frekansı) tarafından
sınırlandığını da unutmamak gerekir — düşük çözünürlüklü/downsample edilmiş veride
yüksek frekanslı fiziksel olgular temelde kayıp olabilir, hiçbir dönüşüm bunu geri
getiremez.

---

## 12. Qiu, Lee, Lin, Yu (2006, JSV) — Dalgacık Filtre Tabanlı Zayıf İmza Tespiti

**Kaynak:** Qiu, H., Lee, J., Lin, J., & Yu, G. (2006). *Wavelet filter-based
weak signature detection method and its application on rolling element
bearing prognostics.* Journal of Sound and Vibration.
https://doi.org/10.1016/j.jsv.2005.03.007 (açık erişim:
https://www.researchgate.net/publication/223556476)

**Ne öneriyor:** Rulman arızalarının erken/zayıf titreşim imzalarını gürültüden
ayıklamak için iki dalgacık tekniğini (dekompozisyon-tabanlı vs filtre-tabanlı)
karşılaştırıp, darbe-benzeri (impulsive) mekanik sinyaller için filtre-tabanlı
yaklaşımın daha güvenilir olduğunu gösteriyor.

**Genel çıkarım:** Bu makale, "hangi sinyal işleme tekniğinin doğru olduğu"
sorusunun **sinyalin fiziksel karakterine bağlı** olduğunu gösteriyor — düzgün/
yumuşak değişen sinyaller için bir teknik (dekompozisyon), darbe-benzeri/ani
sinyaller için başka bir teknik (filtre) daha uygun. Genel ders: bir sinyal işleme
yöntemini seçerken, "literatürde popüler olan" yerine "aranan fiziksel olgunun
doğasına uyan" tekniği seçmek önemli — rulman arızaları genelde darbe-benzeri
olduğu için filtre-tabanlı yaklaşımlar, yumuşak/kademeli bozulma gösteren
sistemlerden (örn. kimyasal aşınma) farklı bir muameleyi hak ediyor.

---

## 13. Damage Propagation Modeling Notebook'u (Kaggle, açık kaynak) — Beklenen Değer Çerçevesi

Ayrıca dayandığı orijinal veri seti kaynağı:
Saxena, A., Goebel, K., Simon, D., & Eklund, N. (2008). *Damage Propagation
Modeling for Aircraft Engine Run-to-Failure Simulation.* International
Conference on Prognostics and Health Management (PHM08).

**Ne öneriyor:** RUL regresyonunu iş dünyasının "Data Science for Business" kitabından
alınan bir maliyet-fayda matrisiyle birleştirip, model performansını doğrudan
dolar cinsinden ifade ediyor; ayrıca **asimetrik bir skor fonksiyonu** (geç
tahmini erken tahminden daha ağır cezalandıran) kullanıyor.

**Genel çıkarım:** Bu, akademik makalelerin çoğunda görülmeyen ama pratikte en
önemli adımlardan biri — bir RUL modelinin "iyi" olup olmadığı, R²/RMSE gibi
istatistiksel metriklerle değil, **gerçek karar senaryosundaki maliyet
yapısıyla** değerlendirilmeli. İki model, aynı R²'ye sahip olsa bile, biri
"az sayıda ama çok pahalı hatalar" yaparken diğeri "çok sayıda ama ucuz hatalar"
yapıyorsa, iş değeri açısından çok farklı olabilirler. Ayrıca asimetrik skorlama
(geç tahmini ağır cezalandırma), gerçek bakım kararlarının doğasında zaten var
olan bir asimetriyi (kaçırılan arıza > gereksiz bakım) modele yansıtıyor — RMSE
gibi simetrik metrikler bu asimetriyi tamamen gözden kaçırıyor.

---

## 14. Genel Sentez: Tüm Kaynaklardan Ortaya Çıkan Ortak Temalar

1. **Retrospektif güç, prospektif (erken uyarı) güç anlamına gelmez.** Neredeyse
   her makale/deneme, tam-ömür/geç-dönem verisiyle test edildiğinde güçlü,
   erken-dönem verisiyle test edildiğinde zayıf sonuç veriyor — bu, tek bir
   veri setine özgü bir tuhaflık değil, alanın yapısal bir özelliği gibi görünüyor.
2. **Küçük n, modelin karmaşıklığından bağımsız olarak temel bir sınır koyuyor.**
   Regularizasyon, ensemble, Bayesian katmanlar — hiçbiri küçük örneklem
   sorununu tam olarak çözmüyor, sadece etkisini kısmen azaltabiliyor.
3. **Doğru sinyal işleme dönüşümü, "yok sanılan" sinyali ortaya çıkarabilir** —
   ama veri çözünürlüğü/kalitesi tarafından konan fiziksel sınırları aşamaz.
4. **Bir modelin başarısı, istatistiksel metriklerden çok gerçek karar
   senaryosundaki maliyet yapısıyla ölçülmeli** — expected-value çerçeveleri,
   akademik metriklerin göremediği şeyi görünür kılıyor.
5. **Yöntem seçimi, sinyalin fiziksel/istatistiksel karakterine göre yapılmalı**
   (monoton mu değil mi, darbe-benzeri mi yumuşak mı, trendability yüksek mi
   düşük mü) — "popüler/yeni" bir yöntemi doğrudan uygulamak yerine, önce
   verinin bu yöntemin varsayımlarını karşılayıp karşılamadığını test etmek
   zaman kazandırıyor.
