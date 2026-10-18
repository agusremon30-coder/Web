import { getDb } from "../api/queries/connection";
import {
  users,
  genres,
  novels,
  novelGenres,
  chapters,
  ratings,
  comments,
  libraryItems,
  follows,
} from "./schema";
import { eq } from "drizzle-orm";

function wc(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const GENRES = [
  { name: "Fantasi", slug: "fantasi", description: "Dunia sihir, mitos, dan petualangan luar biasa" },
  { name: "Romansa", slug: "romansa", description: "Kisah cinta yang menghangatkan dan mengharukan" },
  { name: "Misteri", slug: "misteri", description: "Teka-teki, detektif, dan rahasia yang tersembunyi" },
  { name: "Horor", slug: "horor", description: "Kisah menegangkan yang membuat bulu kuduk meremang" },
  { name: "Fiksi Ilmiah", slug: "fiksi-ilmiah", description: "Teknologi, masa depan, dan kemungkinan tak terbatas" },
  { name: "Petualangan", slug: "petualangan", description: "Perjalanan seru menjelajah tempat dan tantangan baru" },
  { name: "Slice of Life", slug: "slice-of-life", description: "Potret keseharian yang hangat dan dekat dengan hati" },
  { name: "Sejarah", slug: "sejarah", description: "Kisah dari masa lalu yang membentuk hari ini" },
  { name: "Thriller", slug: "thriller", description: "Ketegangan tanpa henti hingga halaman terakhir" },
  { name: "Drama", slug: "drama", description: "Konflik batin dan hubungan manusia yang mendalam" },
];

const AUTHORS = [
  { unionId: "seed-author-saraswati", name: "Saraswati Ayu", penName: "Saras Ayu", bio: "Penulis fantasi dan romansa dari Yogyakarta. Percaya bahwa setiap hujan menyimpan cerita.", email: "saras@lentera.id" },
  { unionId: "seed-author-brama", name: "Brama Wijaya", penName: "B. Wijaya", bio: "Penggemar sejarah nusantara dan cerita rakyat. Menulis untuk menghidupkan kembali masa lalu.", email: "brama@lentera.id" },
  { unionId: "seed-author-naila", name: "Naila Rahma", penName: "Naila R.", bio: "Menulis misteri dan thriller di sela-sela pekerjaannya sebagai jurnalis.", email: "naila@lentera.id" },
  { unionId: "seed-author-damar", name: "Damar Sasongko", penName: "Damar S.", bio: "Penulis horor dan fiksi ilmiah. Suka hal-hal yang membuat orang sulit tidur.", email: "damar@lentera.id" },
  { unionId: "seed-reader-1", name: "Citra Lestari", penName: "Citra", bio: "Pembaca setia.", email: "citra@lentera.id" },
  { unionId: "seed-reader-2", name: "Rangga Pratama", penName: "Rangga", bio: "Kutu buku.", email: "rangga@lentera.id" },
  { unionId: "seed-reader-3", name: "Mega Utami", penName: "Mega", bio: "Suka novel sejarah.", email: "mega@lentera.id" },
];

type ChapterSeed = { title: string; content: string };
type NovelSeed = {
  title: string;
  synopsis: string;
  author: string; // unionId
  genres: string[]; // slugs
  status: "ongoing" | "completed" | "hiatus";
  coverStyle: string;
  isFeatured?: boolean;
  viewCount: number;
  chapters: ChapterSeed[];
};

const NOVELS: NovelSeed[] = [
  {
    title: "Lentera di Ujung Hujan",
    synopsis:
      "Di kota kecil yang diguyur hujan hampir sepanjang tahun, Laras menemukan sebuah lentera tua yang hanya menyala saat seseorang berkata jujur. Ketika lentera itu mempertemukannya dengan Bagas, pemuda yang menyimpan rahasia tentang hilangnya ayah Laras sepuluh tahun lalu, keduanya harus memilih: membiarkan lentera padam, atau menghadapi kebenaran yang menyakitkan.\n\nSebuah kisah tentang kejujuran, kehilangan, dan cahaya kecil yang tersisa di ujung hujan.",
    author: "seed-author-saraswati",
    genres: ["romansa", "drama"],
    status: "ongoing",
    coverStyle: "ember",
    isFeatured: true,
    viewCount: 12840,
    chapters: [
      {
        title: "Kota yang Tak Pernah Kering",
        content: `Hujan turun lagi sore itu, seperti kemarin, seperti seminggu yang lalu, seperti sebelas bulan dalam setahun di Kota Tering.

Laras berdiri di beranda toko antik milik neneknya, memperhatikan air mengalir di selokan seperti sungai kecil yang tak pernah kehabisan cerita. Orang-orang bilang Kota Tering adalah kota yang dilupakan matahari. Laras bilang, kota ini hanya lebih suka mendengarkan hujan.

"Non Laras, tolong catat barang yang baru datang," suara Nenek dari dalam, serak tapi tegas.

Di antara kotak-kotak kayu berdebu itulah Laras menemukannya: sebuah lentera kuningan dengan ukiran sulur melati, kacanya buram oleh usia. Tidak ada keterangan di kardusnya. Tidak ada nota pembelian. Lentera itu seperti datang sendiri, menunggu ditemukan.

"Aneh," gumamnya. Ia mengangkat lentera itu ke dekat jendela, dan untuk sesaat—hanya sesaat—ia bisa bersumpah melihat cahaya kecil berpijar di dalamnya, padahal sumbunya kering dan tidak ada minyak sama sekali.

Malam itu, hujan semakin deras. Laras meletakkan lentera di meja kamarnya. Ketika ibunya mengetuk pintu dan bertanya apakah ia baik-baik saja, Laras menjawab, "Aku baik, Bu."

Dan lentera itu menyala.

Laras menatapnya dengan napas tertahan. Api kecil keemasan menari di balik kaca buram, hangat, hidup. Ia mengulang kalimatnya dalam hati—aku baik-baik saja—dan tahu kalimat itu bohong. Ia tidak baik-baik saja sejak ayahnya pergi sepuluh tahun lalu.

Tapi lentera itu menyala justru saat ia berbohong... atau saat ia jujur?

Ia mengujinya sekali lagi. "Namaku Laras." Api membesar. "Aku tidak merindukan Ayah." Api itu meredup, hampir padam.

Laras duduk di tepi tempat tidur, memeluk lututnya, dan untuk pertama kalinya dalam sepuluh tahun, ia menangis di depan sebuah cahaya.`,
      },
      {
        title: "Pemuda dari Stasiun Tua",
        content: `Bagas datang ke toko antik itu pada hari Selasa, ketika hujan sedang malas-malasnya turun—gerimis panjang yang membuat segalanya terasa seperti mimpi.

Ia mencari jam saku. "Peninggalan ayah saya dijual orang tanpa izin," katanya pada Nenek, suaranya pelan tapi ada bara di sana. "Saya dengar barang-barang dari rumah tua di Jalan Kenanga berakhir di sini."

Laras yang sedang mencatat inventaris mendongak. Rumah di Jalan Kenanga. Rumah itu. Ia menahan napas; lentera di tas kanvasnya—yang selalu ia bawa sejak malam itu—terasa hangat di sisi tubuhnya.

"Saya yang pegang catatan barang masuk," kata Laras. "Kapan persisnya barang itu dikirim?"

"Sepuluh tahun lalu." Bagas menatapnya, dan ada sesuatu di matanya yang membuat Laras yakin: pemuda ini juga sedang berbohong tentang sesuatu. "Musim hujan tahun itu."

Tahun itu. Tahun ketika ayah Laras menghilang tanpa jejak, meninggalkan sepasang sepatu basah di depan pintu dan payung yang masih tergantung di gantungan. Polisi bilang mungkin pergi sukarela. Ibunya tidak pernah mau membicarakannya.

Mereka membongkar arsip bersama sampai sore. Bagas ternyata pandai membaca tulisan tangan buram, dan Laras pandai mengingat letak kotak. Di antara mereka, lentera di dalam tas itu tetap hangat, seperti mendengarkan.

"Ketemu," kata Bagas akhirnya, mengangkat sebuah buku catatan pengiriman bertanggal lama. Namun yang ia tunjuk bukan jam saku. Di baris itu tertulis: satu lentera kuningan, diantar oleh B. Wiryawan—nama ayah Laras.

Lentera itu berasal dari rumah Jalan Kenanga. Rumah tempat ayahnya terakhir terlihat. Dan Bagas, yang mengaku mencari jam saku, tiba-tiba tidak berani menatap mata Laras lagi.`,
      },
      {
        title: "Rumah di Jalan Kenanga",
        content: `Rumah di Jalan Kenanga nomor 14 sudah kosong sejak Laras kecil. Pagar besinya berkarat, halamannya ditumbuhi kenanga liar yang bunganya jatuh dan membusuk manis di tanah basah.

"Rumah ini milik keluargaku," kata Bagas akhirnya, di depan pagar itu, sementara hujan rintik membasahi bahu jaketnya. "Kakekku. Dia... dikenal sebagai orang aneh. Orang kota bilang dia kolektor barang-barang bertuah."

Laras mengeluarkan lentera dari tasnya. Di bawah langit kelabu, lentera itu menyala sendiri—redup, waspada, seperti jantung yang berdebar.

"Setiap lentera punya syarat menyala," kata Bagas pelan. "Kakekku bilang, lentera kejujuran hanya menyala untuk orang yang berani jujur pada dirinya sendiri. Dan lentera itu memilihmu."

"Kenapa ayahku mengantarnya ke tokoku?"

Bagas diam lama. Hujan mengisi keheningan dengan suaranya yang sabar.

"Karena malam itu ayahmu datang ke rumah ini," katanya akhirnya. "Malam terakhir dia terlihat. Dia datang menemui kakekku. Dan sesuatu terjadi di ruang bawah tanah rumah ini—sesuatu yang membuat kakekku mengunci pintunya selamanya, dan membuat ayahmu... tidak pernah pulang."

Laras menatap pintu kayu rumah itu. Sepuluh tahun ia berjalan melewati rumah ini tanpa pernah tahu bahwa jawaban atas seluruh hidupnya terkunci di baliknya.

"Kalau kita masuk," katanya, suaranya bergetar tapi lentera di tangannya tiba-tiba menyala terang, "tidak ada lagi bohong di antara kita. Mulai sekarang."

Bagas mengangguk. Dan untuk pertama kalinya, Laras melihat pemuda itu tersenyum—sedih, lega, dan takut, semuanya sekaligus.`,
      },
      {
        title: "Ruang Bawah Tanah",
        content: `Kunci rumah itu masih disimpan Bagas, di kalung yang selalu disembunyikannya di balik baju.

Di dalam, waktu berhenti sepuluh tahun yang lalu. Koran di meja bertanggal malam hilangnya ayah Laras. Dua cangkir teh di meja tamu, salah satunya masih terisi ampas yang mengering menjadi kerak hitam. Laras mengenali gelas ayahnya dari kebiasaannya: bibir gelas diputar sedikit ke kiri.

Tangga ke ruang bawah tanah ada di balik dapur, tertutup lemari es tua yang didorong menghalangi. Butuh dua orang untuk menggesernya—dan Laras tidak yakin itu kebetulan.

Di bawah, lentera Laras menyala paling terang yang pernah ia lihat.

Ruang itu penuh lentera. Puluhan, mungkin ratusan, tergantung di langit-langit rendah, masing-masing dengan ukiran berbeda—semuanya gelap, kecuali satu di meja kerja di sudut ruangan. Di sebelahnya, sebuah buku harian bersampul kulit, dan sepucuk surat yang ditujukan kepada: Laras-ku.

Tangan Laras gemetar saat mengambil surat itu. Tulisan ayahnya, miring ke kanan, tergesa-gesa:

"Laras, kalau kau membaca ini, berarti lentera sudah memilihmu seperti dulu ia memilih Ayah. Ayah tidak hilang, Nak. Ayah menjaga sesuatu di sini—sesuatu yang tidak boleh padam. Maafkan Ayah yang tidak bisa pulang sebelum tugas ini selesai. Nyalakan lenteramu. Kau akan menemukan Ayah."

Di bawah surat itu, di lantai ruang bawah tanah, ada pintu jebakan yang tidak ada di denah rumah mana pun.

Bagas menatapnya dengan wajah pucat. "Kakekku tidak pernah cerita soal pintu itu."

Laras mengangkat lenteranya tinggi-tinggi. "Sekarang," katanya, "dia tidak perlu."`,
      },
    ],
  },
  {
    title: "Serat Kalamanggala",
    synopsis:
      "Majapahit, 1328. Gajah Mada baru saja diangkat menjadi patih, tetapi di balik kemegahan istana, seorang juru tulis muda bernama Dyah Pitaloka menemukan serat (naskah) terlarang yang meramalkan runtuhnya kerajaan. Bersama prajurit rendahan Rangga Lawe, ia terjebak dalam intrik istana, perebutan takhta, dan ramalan yang perlahan menjadi kenyataan.\n\nNovel sejarah-fantasi tentang kekuasaan, kesetiaan, dan harga sebuah ramalan.",
    author: "seed-author-brama",
    genres: ["sejarah", "fantasi"],
    status: "ongoing",
    coverStyle: "goldleaf",
    isFeatured: true,
    viewCount: 20340,
    chapters: [
      {
        title: "Juru Tulis Istana",
        content: `Tinta belum kering ketika Dyah Pitaloka menyadari bahwa aksara yang baru saja ia salin bukan aksara biasa.

Sebagai juru tulis rendahan di perpustakaan istana Majapahit, tugasnya sederhana: menyalin lontar-lontar tua yang mulai lapuk agar isinya tidak hilang ditelan rayap dan zaman. Ia tidak dibayar untuk membaca, apalagi memahami.

Namun serat di hadapannya ini berbeda. Daun lontarnya hitam seperti dibakar, dan aksaranya—demi Bathara—bergerak.

Pitaloka mengucek mata. Aksara itu diam. Ia mencondongkan badan, dan aksara itu bergeser lagi, seperti semut yang mengatur barisan, membentuk kalimat yang tidak ada sebelumnya:

KETIKA GAJAH BERTAKHTA, LANGIT AKAN MENANGIS DARAH.

Ia menarik napas panjang. Di istana, menemukan barang aneh bukan berita baik. Barang aneh berarti pertanyaan, dan pertanyaan di istana Majapahit bisa berakhir dengan leher di ujung pedang.

Ia harusnya melaporkannya ke Empu Wreksa, kepala perpustakaan. Ia harusnya.

Sebaliknya, malam itu Pitaloka menyelipkan serat itu ke balik kembennya dan membawanya pulang ke rumah panggung kecil di pinggir kali. Di bawah cahaya obor, ia membaca naskah itu dari awal—dan tidak berhenti sampai ayam berkokok.

Serat Kalamanggala. Ditulis seratus tahun sebelum Majapahit berdiri, oleh seorang resi tanpa nama. Isinya: ramalan demi ramalan tentang kerajaan yang akan runtuh oleh tangan orang-orangnya sendiri. Dan di halaman terakhir, sebuah nama yang membuat darahnya dingin.

Namanya sendiri.`,
      },
      {
        title: "Prajurit dari Gerbang Timur",
        content: `Rangga Lawe bukan prajurit istimewa. Ia menjaga gerbang timur, gerbang paling membosankan di seluruh Trowulan, tempat paling sering terjadi hanyalah kambing lepas dan pedagang yang salah jalan.

Sampai malam ia menangkap seorang gadis memanjat tembok istana dengan sebilah lontar hitam di tangannya.

"Aku bukan pencuri," kata gadis itu, terengah-engah, setengah tergantung di tembok. "Aku juru tulis."

"Juru tulis tidak memanjat tembok di tengah malam."

"Juru tulis juga tidak menemukan naskah yang meramalkan kematian raja, tapi di sinilah kita."

Rangga Lawe seharusnya menyeret gadis itu ke pengadilan. Namun ada sesuatu dalam mata gadis itu—bukan ketakutan, melainkan tekad yang putus asa—yang membuatnya, untuk alasan yang kelak akan ia sesali dan syukuri sekaligus, malah membantunya turun.

"Ceritakan," katanya. "Semuanya."

Mereka duduk di menara jaga yang kosong, dan gadis itu—Dyah Pitaloka—membuka lontar hitamnya. Di bawah cahaya bulan, aksara-aksara itu bergerak dan menata diri, dan Rangga Lawe membaca tentang banjir besar, pemberontakan di timur, dan seorang patih yang namanya tidak disebut tetapi semua orang tahu siapa.

"Kalau ini benar," bisik Rangga Lawe, "kita sedang membaca surat kematian kerajaan."

"Dan kalau ini benar," jawab Pitaloka, "ada orang lain yang juga sudah membacanya. Karena ramalan pertama—tentang sumur istana yang meracuni tiga abdi—sudah terjadi. Minggu lalu."

Di kejauhan, lonceng pura berbunyi tengah malam. Entah kenapa, bunyinya terdengar seperti peringatan.`,
      },
      {
        title: "Banjar Warih yang Terbakar",
        content: `Ramalan kedua tergenapi tiga hari kemudian.

Banjar Warih, kampung di tepi Brantas, terbakar habis dalam semalam. Bukan kebakaran biasa—penduduk bersikeras api datang dari dalam tanah, biru kehijauan, dan tidak mempan disiram air.

Pitaloka dan Rangga Lawe sampai di sana ketika abu masih mengepul. Di antara puing-puing, mereka menemukan sesuatu yang membuat Pitaloka menutup mulutnya: aksara terbakar di tanah, membentuk pola yang sama persis dengan sampul Serat Kalamanggala.

"Seseorang menggenapi ramalan ini dengan sengaja," bisiknya. "Bukan ramalan. Ini... ini daftar tugas."

Di reruntuhan pura kecil, mereka menemukan saksi: seorang pertapa tua yang selamat karena sedang bermeditasi di gua. Matanya buta, tapi ia menggeleng sebelum mereka bertanya.

"Kalian terlambat tujuh ratus tahun," kata pertapa itu. "Serat itu tidak meramalkan masa depan. Ia mengingat masa lalu. Segalanya sudah pernah terjadi, dan akan terjadi lagi, dan lagi. Yang kalian sebut ramalan hanyalah lingkaran yang berputar."

"Kalau begitu bagaimana menghentikannya?" tanya Rangga Lawe.

Pertapa itu tersenyum tanpa gigi. "Lingkaran tidak bisa dihentikan, Anak Muda. Tapi bisa dipatahkan—di satu titik, oleh satu orang yang berani keluar dari putarannya." Matanya yang buta menatap lurus ke arah Pitaloka. "Dan titik itu selalu seorang perempuan yang bisa membaca."`,
      },
      {
        title: "Surat untuk Sang Patih",
        content: `Istana gempar. Serat Kalamanggala hilang dari perpustakaan, dan Empu Wreksa ditemukan tewas di biliknya—mulut berbusa, sama seperti tiga abdi yang keracunan sumur.

Pitaloka kini buronan.

"Susun strategi kita di sini," kata Rangga Lawe, menyeringai tipis di gubuk nelayan tempat mereka bersembunyi, hanya berani menyalakan api sebesar biji jagung. "Kamu juru tulis paling dicari di Majapahit. Aku prajurit gerbang timur yang menghilang di malam yang sama. Kita pasangan paling mencurigakan di seluruh kerajaan."

"Ada yang lebih buruk," kata Pitaloka. Ia membuka halaman tengah serat itu, halaman yang baru bisa terbaca setelah terkena abu Banjar Warih. "Ramalan berikutnya: Sang Patih akan berdiri di atas darah sahabatnya. Gajah Mada akan membunuh—atau dibunuh. Dan yang memicu semuanya adalah sebuah surat."

"Surat apa?"

"Surat yang belum ditulis." Pitaloka mengangkat pena tulisnya, dan untuk pertama kalinya Rangga Lawe melihat gadis itu tersenyum—senyum orang yang sudah tidak punya apa-apa untuk hilang. "Jadi kita yang akan menulisnya duluan. Kita ubah isinya, kita ubah takdirnya."

Di luar, Brantas mengalir gelap menuju laut, membawa abu Banjar Warih dan awal dari segala yang akan datang.`,
      },
    ],
  },
  {
    title: "Arsip Kamar 307",
    synopsis:
      "Jurnalis muda Nara Adikara menerima paket misterius berisi rekaman suara dari kamar hotel yang sudah tidak ada—Hotel Surya kamar 307, yang terbakar dua puluh tahun lalu menewaskan sembilan orang. Suara di rekaman itu menyebut nama korban yang belum pernah dipublikasi. Semakin dalam Nara menyelidik, semakin ia yakin kebakaran itu bukan kecelakaan, dan orang yang bertanggung jawab kini menjadi pejabat penting di kotanya.",
    author: "seed-author-naila",
    genres: ["misteri", "thriller"],
    status: "ongoing",
    coverStyle: "noir",
    isFeatured: true,
    viewCount: 17650,
    chapters: [
      {
        title: "Paket Tanpa Pengirim",
        content: `Paket itu datang hari Senin, di antara tagihan dan brosur makanan: kotak cokelat sebesar buku, tanpa nama pengirim, alamat tujuan ditulis tangan dengan tinta biru tua.

Di dalamnya: sebuah walkman tua, satu kaset bertuliskan "307" dengan spidol hitam, dan potongan koran dua puluh tahun lalu tentang kebakaran Hotel Surya.

Nara Adikara, jurnalis rubrik kota dengan utang tiga artikel, seharusnya melemparnya ke tumpukan "nanti". Tetapi angka 9 korban tewas di koran itu dicoret spidol merah, dan di bawahnya ditulis tangan: 10.

Ia menekan tombol play.

Rekaman itu berkualitas buruk—statik, derau, suara hujan. Lalu sebuah suara perempuan, pelan, seperti direkam dari balik dinding: "...tolong, pintunya terkunci dari luar. Saya di kamar 307. Nama saya Ratna Kusuma. Tolong catat nama saya. Ratna Kusuma. Kalau saya tidak keluar dari sini, bukan kecelakaan. Bukan—" 

Rekaman terputus.

Nara memutarnya tiga kali. Ratna Kusuma. Ia membuka arsip digital kantornya dan mencari daftar resmi korban kebakaran Hotel Surya. Sembilan nama.

Ratna Kusuma tidak ada di daftar mana pun.

Jam dua pagi, Nara masih di mejanya, dengan sepuluh tab browser dan satu kepastian yang dingin di perutnya: seseorang menghapus satu korban dari sejarah. Dan seseorang yang lain—dua puluh tahun kemudian—ingin dia menemukannya.`,
      },
      {
        title: "Tamu yang Tidak Terdaftar",
        content: `Hotel Surya tidak pernah dibangun kembali. Lahannya kini menjadi lapangan parkir mal yang sepi, tetapi arsip kota menyimpan denahnya, dan Nara menghafalnya seperti doa: lantai tiga, kamar 307 di ujung lorong timur, menghadap sungai.

Ia menemukan mantan resepsionis hotel itu di panti jompo di pinggir kota. Perempuan tua bernama Bu Tien, ingatannya kabur soal sarapan pagi ini, tetapi tajam soal malam dua puluh tahun lalu.

"Kamar 307?" Matanya yang rabun tiba-tiba fokus. "Tamu tetap. Perempuan. Bayar tunai tiap bulan, tidak pernah pakai nama sama dua kali. Tapi saya ingat dia. Dia selalu minta handuk ekstra dan tidak pernah membiarkan room service masuk."

"Dia sedang bersembunyi?"

"Semua orang yang menginap berbulan-bulan di hotel murah sedang bersembunyi dari sesuatu, Nak." Bu Tien mengetuk-ngetuk meja dengan jarinya. "Seminggu sebelum kebakaran, dia datang ke resepsionis, ketakutan. Katanya kalau terjadi apa-apa padanya, ada map kuning yang harus diserahkan ke polisi. Saya titipkan ke manajer."

"Manajernya siapa?"

Bu Tien diam lama. "Pak Hartono. Manajer Hotel Surya." Ia menatap Nara. "Sekarang namanya Hartono Wibisono. Dia ketua yayasan yang membangun rumah sakit baru itu. Fotonya ada di koran minggu lalu."

Nara menulis nama itu, dan tangannya tidak berhenti gemetar sampai ia kembali ke mobil.`,
      },
      {
        title: "Map Kuning",
        content: `Kaset kedua datang seminggu kemudian. Kali ini ke meja redaksi, dan kali ini tulisannya berbeda—lebih terburu-buru, spidol biru, bukan hitam.

Ada dua orang yang mengirimiku petunjuk, pikir Nara. Dan mereka tidak saling kenal.

Kaset kedua berisi rekaman yang sama dari sudut berbeda—lebih jernih, lebih dekat. Suara Ratna Kusuma, dan di latar belakang, samar, suara seorang pria: "...map itu sudah aman. Tidak akan ada yang percaya perempuan sepertimu. Hotel ini akan jadi akhir ceritamu, dan tidak ada yang akan mencari kamar 307."

Lalu suara itu—suara ketiga, berderak, statik. Api.

Nara membawa salinannya ke satu-satunya orang yang ia percaya: Kompol Larasati, polisi perempuan yang dua kali menolak promosi demi tetap menangani kasus-kasus dingin.

"Map kuning," kata Larasati setelah mendengar semuanya. "Dua puluh tahun lalu ada laporan orang hilang atas nama Ratna Kusuma. Ditutup dua minggu kemudian. Alasan penutupan: pelapor menarik laporan." Ia menatap Nara. "Pelapornya bernama Hartono Wibisono."

"Jadi dia melaporkan Ratna hilang, lalu menarik laporannya sendiri?"

"Dan dua minggu setelah itu, Hotel Surya terbakar. Listrik korslet, kata laporan resmi." Larasati mengetuk folder di mejanya. "Tapi laporan kebakaran itu ditandatangani oleh orang yang tiga tahun kemudian menjadi kepala dinas pemadam—diangkat oleh walikota yang kampanyenya dibiayai yayasan Hartono."

Benang-benang itu mulai terlihat. Dan semuanya mengarah ke satu nama.`,
      },
      {
        title: "Kamar yang Dibangun Kembali",
        content: `Gedung arsip kota menyimpan sesuatu yang tidak disimpan siapa pun: laporan harian pemadam kebakaran, salinan karbon, dua puluh tahun.

Di halaman empat, juru tulis pemadam mencatat: pintu kamar 307 ditemukan terkunci dari luar dengan rantai. Pintu-pintu lain tidak.

Nara memfoto halaman itu dengan tangan dingin. Kebakaran tidak mengunci pintu dari luar. Orang yang melakukannya.

Malam itu, untuk pertama kalinya, pengirim paket menampakkan diri. Seorang perempuan tua menunggu di depan kos Nara, berdiri di bawah hujan tanpa payung, dan Nara tahu sebelum perempuan itu bicara.

"Saya adik Ratna," katanya. "Dua puluh tahun saya menunggu seseorang yang cukup gila untuk membuka ini lagi. Map kuning itu ada. Kakak saya menyembunyikan salinannya sebelum dia—" Suaranya patah. "Dia menitipkannya di tempat yang menurutnya tidak akan pernah disentuh siapa pun."

"Di mana?"

"Di kamar 307 itu sendiri. Dia membangun dinding palsu. Kakak saya tukang sebelum dia jadi buronan. Lahan hotel itu—mal itu—dibangun di atas fondasi lama. Ruang bawah tanahnya masih ada. Kamar 307 masih ada di bawah sana, Nak Nara. Terkubur, tapi utuh."

Dan malam itu juga, mereka berdua berdiri di depan lapangan parkir yang sepi, dengan sekop, senter, dan nama seorang perempuan yang tidak akan dihapus siapa pun dari sejarah.`,
      },
    ],
  },
  {
    title: "Warung Kopi Tengah Malam",
    synopsis:
      "Warung kopi kecil di gang sempit itu hanya buka tengah malam sampai subuh. Pelanggannya: sopir taksi, perawat pulang shift, musisi gagal, dan orang-orang yang tidak bisa tidur karena hidupnya terlalu berisik. Kisah-kisah hangat tentang orang-orang biasa yang bertemu di jam paling sepi dalam sehari—dan barista misterius yang selalu tahu pesananmu sebelum kamu memesan.",
    author: "seed-author-saraswati",
    genres: ["slice-of-life", "drama"],
    status: "completed",
    coverStyle: "cream",
    viewCount: 9870,
    chapters: [
      {
        title: "Buka Pukul Dua Belas",
        content: `Warung itu tidak punya nama. Orang-orang menyebutnya "warung tengah malam" saja, dan semua orang tahu maksudnya.

Mas Ruli, baristanya, membuka rolling door tepat pukul dua belas, menyalakan lampu kuning temaram, menata enam kursi kayu yang tidak serasi, dan mulai menyangrai biji yang aromanya—entah bagaimana—selalu sampai ke ujung gang tepat saat ada orang yang membutuhkannya.

Pelanggan pertama malam itu Mbak Sari, perawat IGD yang baru pulang shift, masih dengan noda betadine di lengan seragamnya.

"Yang biasa?" tanya Mas Ruli.

"Yang bisa bikin lupa hari ini," kata Mbak Sari.

Mas Ruli tidak bertanya. Ia tidak pernah bertanya. Ia menyeduh kopi tubruk dengan gula aren sedikit lebih banyak dari biasanya, menaruhnya di depan Mbak Sari, dan kembali ke balik bar.

"Tujuh belas orang hari ini," kata Mbak Sari akhirnya, pada kopinya, bukan pada siapa-siapa. "Enam belas selamat."

Warung itu diam dengan cara yang benar. Sopir taksi di sudut tidak menoleh. Mahasiswa yang bergadang menulis skripsi tidak berhenti mengetik. Semua orang memberi Mbak Sari satu meja dan satu malam untuk dirinya sendiri.

Itulah aturan tidak tertulis warung tengah malam: tidak ada yang bertanya, tapi tidak ada yang benar-benar sendirian.`,
      },
      {
        title: "Lelaki dengan Dua Gelas",
        content: `Setiap Kamis, lelaki tua itu datang pukul dua pagi dan memesan dua gelas kopi.

Satu dia minum. Satu dia biarkan dingin di seberang meja.

Anak-anak kos yang suka nongkrong di situ punya teori macam-macam: menunggu pacar, menunggu anak, menunggu hantu. Mas Ruli tidak pernah ikut-ikutan. Ia hanya selalu menyeduh dua gelas, dan tidak pernah menagih yang kedua.

Kamis itu, hujan deras dan warung kosong kecuali lelaki tua itu. Mungkin karena sepi, atau mungkin karena hujan membuat orang ingin bicara, lelaki itu akhirnya bercerita.

"Empat puluh tahun kami minum kopi bersama setiap Kamis," katanya, menatap gelas di seberangnya. "Istri saya. Dia yang sebenarnya tidak suka kopi—dia suka Kamisnya."

Ia memutar cincin di jarinya, pelan-pelan.

"Tiga tahun dia pergi, dan saya masih pesan dua gelas. Bodoh, ya?"

"Tidak," kata Mas Ruli, sambil menyeka gelas yang sudah bersih. "Rindu tidak pernah bodoh, Pak. Cuma kadang tidak tahu harus ditaruh di mana."

Lelaki tua itu tertawa kecil, dan untuk pertama kalinya dalam tiga tahun, ia minum gelas keduanya juga. "Biar dia tidak kedinginan di seberang sana," katanya, setengah bercanda, setengah doa.

Pukul tiga, ia pulang. Dan Mas Ruli mencatat di buku kecilnya: Kamis depan, seduhkan dua. Satu untuk Pak Warga, satu untuk rindunya.`,
      },
      {
        title: "Musisi di Kursi Sudut",
        content: `Gitaris itu datang setiap malam, membawa gitar tua dengan senar yang tak pernah lengkap, dan duduk di kursi sudut tanpa pernah memainkan satu nada pun.

Namanya Dio. Dulu—lima tahun lalu—namanya ada di poster-poster acara kampus. Lalu band-nya bubar, panggung-panggung menutup pintu, dan sekarang ia hanya laki-laki yang membawa gitar ke mana-mana seperti orang membawa luka.

Malam itu ada anak kecil di warung—anak pemilik tambal ban sebelah, tidak bisa tidur, ikut bapaknya lembur. Anak itu menatap gitar Dio dengan mata bulat.

"Om bisa main gitar?"

"Dulu."

"Sekarang?"

Dio membuka mulut untuk bilang tidak, tapi anak itu sudah duduk di depannya dengan tangan bertopang dagu, menunggu. Dan warung tengah malam—dengan hujannya, dengan lampu kuningnya, dengan Mbak Sari yang tertidur di meja—tiba-tiba menjadi panggung paling aman di dunia.

Jadi Dio memetik senar. Lagu sederhana, lagu anak-anak, senar ketiga putus di tengah dan tidak ada yang peduli. Anak itu tertawa. Sopir taksi bertepuk tangan. Dan Dio menemukan bahwa tangannya masih ingat jalan pulang ke musik, meski hatinya sudah lama tersesat.

Malam itu, untuk pertama kalinya dalam lima tahun, Dio memesan kopi untuk dirinya sendiri dengan senyum. Besoknya ia kembali. Lusa juga. Dan entah bagaimana, dua bulan kemudian, poster kecil tertempel di pintu warung: "Akustik Tengah Malam, tiap Sabtu, kursi sudut."

Yang datang tiga orang. Dio memainkannya seperti stadion.`,
      },
      {
        title: "Tutup Pukul Lima (Bab Terakhir)",
        content: `Subuh datang seperti biasa: pelan-pelan, kehijauan, dengan azan pertama menggantung di udara lembap.

Warung tengah malam tidak pernah ramai, dan malam terakhir sebelum warung itu harus pindah—gang akan dilebarkan jadi jalan, kata surat dari kelurahan—juga tidak ramai. Hanya orang-orang yang sama: Mbak Sari, Pak Warga, Dio dengan gitarnya, sopir taksi, mahasiswa yang skripsinya akhirnya selesai karena warung ini.

Mas Ruli menyeduh kopi untuk semua orang, gratis, dan tidak mengatakan apa-apa sampai pukul empat.

"Warung akan pindah ke ruko kecil di seberang pasar," katanya akhirnya. "Lebih mahal. Lebih kecil malah. Tapi tetap buka tengah malam."

"Kenapa tengah malam terus, Mas?" tanya mahasiswa itu. "Kalau buka siang kan lebih ramai."

Mas Ruli menyeka meja, mematikan satu lampu, dan menjawab tanpa menoleh.

"Karena siang itu semua orang sudah punya tempat. Yang perlu warung justru orang-orang yang tidak punya tempat di jam lain."

Pukul lima, rolling door turun untuk terakhir kalinya di gang itu. Enam orang berdiri di luar, membawa cangkir masing-masing, menunggu matahari yang tidak buru-buru.

Warung itu tidak punya nama. Tapi bagi enam orang itu—dan ratusan malam sebelumnya—namanya sederhana: rumah.`,
      },
    ],
  },
  {
    title: "Penjaga Mercusuar Terakhir",
    synopsis:
      "Tahun 2147, ketika seluruh pelayaran sudah dipandu satelit, mercusuar terakhir di Indonesia masih menyala di pulau terpencil—dijaga oleh Kirana, perempuan muda yang mewarisi tugas dari kakeknya. Ketika badai raksasa mematikan seluruh jaringan satelit dunia, kapal-kapal di laut hanya punya satu harapan: cahaya tua yang hampir dilupakan semua orang, dan satu-satunya manusia yang masih tahu cara menyalakannya.",
    author: "seed-author-damar",
    genres: ["fiksi-ilmiah", "petualangan"],
    status: "ongoing",
    coverStyle: "abyss",
    viewCount: 8920,
    chapters: [
      {
        title: "Cahaya yang Diremehkan Zaman",
        content: `Mercusuar Pulau Gersang berdiri sejak 1903, dan Kirana adalah penjaga generasi keempatnya.

Ibunya dulu berkata: tugas kita bukan menyalakan lampu. Tugas kita adalah hadir. Setiap malam. Tanpa absen. Meski tidak ada yang melihat.

Dan memang hampir tidak ada yang melihat lagi. Kapal-kapal sekarang dipandu satelit Nusantara-9, awaknya menatap layar, bukan cakrawala. Tahun lalu, kantor pelayaran pusat mengirim surat ketiga: usulan penonaktifan. Efisiensi anggaran.

Kirana membalasnya dengan surat ketiga pula: Mercusuar ini tidak memakan anggaran. Saya menjaganya secara sukarela. Tolong biarkan.

Setiap senja ia menaiki 87 anak tangga besi, memeriksa lensa Fresnel tua yang masih bening, menyalakan lampu halida cadangan yang sudah ia rakit sendiri dari barang bekas kapal karam. Kakeknya mengajarinya membaca cuaca dari warna langit, arah angin dari suara deburan ombak di karang timur versus karang barat.

Malam itu langit berwarna aneh—jingga terlalu lama, seolah matahari enggan tenggelam. Radio galat berdesis. Layar tablet pemberian kantor pelayaran menampilkan satu baris yang membuat alisnya bertaut: GANGGUAN BADAI MATAHARI KELAS X. SATELIT MUNGKIN TERGANGGU.

Kirana menatap cakrawala, tempat langit mulai berdenyut dengan cahaya aurora yang tidak seharusnya terlihat di garis khatulistiwa.

Lalu, satu per satu, layar di seluruh dunia padam.`,
      },
      {
        title: "Malam Ketika Satelit Buta",
        content: `Badai matahari Carrington-2—begitu nanti para ilmuwan menamakannya—menyapu magnetosfer bumi selama 71 jam.

Di Pulau Gersang, tidak ada listrik, tidak ada sinyal, tidak ada berita. Yang ada: laut yang mulai mengganas dan radio galat kakeknya yang berderit menangkap potongan-potongan suara panik dari kapal-kapal di Selat Makassar.

"...kehilangan navigasi, ulangi, kehilangan seluruh navigasi..."

"...meminta posisi visual, apakah ada yang melihat cahaya..."

Kirana menyalakan mercusuarnya pukul enam sore, dua jam lebih awal dari biasanya, dengan daya penuh.

Lalu ia melakukan sesuatu yang tidak pernah diajarkan siapa pun tapi ia tahu harus dilakukan: ia menambah lampu cadangan kedua, mengarahkannya lebih rendah, ke permukaan laut, agar kapal yang terlalu dekat karang bisa melihat garis bahaya. Lalu lampu ketiga, di ujung dermaga, membentuk segitiga cahaya yang kakeknya dulu sebut "pagar untuk yang tersesat".

Sepanjang malam, radio itu tidak berhenti berbicara. Dan satu per satu, suara-suara panik itu berubah:

"...melihat cahaya! Ada mercusuar di koordinat—"

"—ikut cahaya itu. Semua ikut cahaya itu."

Kirana berdiri di puncak mercusuar sepanjang malam, di tengah angin yang menggeram, menjaga tiga titik cahaya tetap hidup dengan tangannya sendiri. Untuk pertama kalinya dalam tiga puluh tahun, mercusuar terakhir di Indonesia sedang benar-benar dibutuhkan.

Dan ia tidak tidur sedetik pun.`,
      },
      {
        title: "Empat Belas Kapal",
        content: `Fajar kedua membawa pemandangan yang tidak pernah dibayangkan Kirana: empat belas kapal berlabuh di teluk kecil Pulau Gersang.

Kapal kargo, kapal penumpang, dua kapal nelayan, satu kapal riset berbendera asing. Semuanya tersesat, semuanya terselamatkan, semuanya memandang mercusuar tua itu seolah menara itu malaikat.

Nakhoda kapal penumpang—perempuan tegap bernama Kapten Halimah—menemui Kirana dengan mata merah karena kurang tidur, sama seperti Kirana.

"Tiga ratus dua belas penumpang," katanya. "Kami hampir menabrak karang barat. Anak buah saya melihat cahaya kedua—yang rendah itu—dan saya tahu itu artinya karang. Siapa yang mengajarmu trik itu?"

"Kakek saya. Dia bilang, laut boleh berubah, kapal boleh berubah, tapi panik tidak pernah berubah. Orang panik butuh cahaya yang sederhana."

Kapten Halimah menatapnya lama. "Seluruh dunia gelap dua malam ini. Kau tahu berapa mercusuar yang masih menyala di seluruh nusantara?" Ia mengangkat satu jari. "Satu. Punyamu."

Sore itu, ketika satelit pertama mulai pulih dan dunia mulai menyala lagi, kantor pelayaran pusat mengirim pesan ke tablet Kirana yang baru kembali hidup. Bukan surat penonaktifan.

Sebuah usulan baru: menjadikan Mercusuar Pulau Gersang situs pelatihan navigasi darurat nasional—dengan Kirana sebagai kepala instrukturnya.

Ia membaca pesan itu di puncak mercusuar, di samping lensa Fresnel berusia 144 tahun, dan untuk pertama kalinya, cahaya tua itu tidak lagi menyala sendirian.`,
      },
    ],
  },
  {
    title: "Rumah Pohon di Kali Code",
    synopsis:
      "Tiga sekawan—Bimo, Tari, dan Yusuf—menemukan rumah pohon tua di tepi Kali Code yang ternyata menyimpan peta harta karun peninggalan masa revolusi. Petualangan musim libur sekolah berubah menjadi perburuan sungguhan ketika mereka sadar bukan hanya mereka yang membaca peta itu.",
    author: "seed-author-brama",
    genres: ["petualangan", "misteri"],
    status: "completed",
    coverStyle: "verdant",
    viewCount: 7210,
    chapters: [
      {
        title: "Markas Baru",
        content: `Liburan sekolah di Yogyakarta seharusnya membosankan. Itu rencana awalnya.

Lalu Bimo menemukan rumah pohon itu: tersembunyi di pohon beringin tua di tepi Kali Code, tangga kayunya setengah lapuk, tapi lantainya masih kokoh. Dari jendelanya, kali berkilau diterpa matahari sore seperti tumpahan koin.

"Markas baru!" seru Bimo.

"Markas kalau kita tentara. Kita cuma anak kelas enam," kata Yusuf, tapi ia sudah naik lebih dulu.

Tari yang menemukan kotaknya. Kotak kaleng biskuit di bawah papan lantai yang goyang, berat, dan ketika dibuka—bukan biskuit. Sebuah gulungan kain kanvas tua, diikat tali rafia.

Di dalamnya: peta. Digambar tangan dengan tinta yang memudar kecokelatan, menggambarkan aliran Kali Code dari utara ke selatan, dengan tanda-tanda aneh: candi, jembatan, pohon beringin—dan di satu titik, tanda silang besar dengan tulisan kecil: "Simpanan Republik, Oktober '48. Untuk yang menemukan dengan hati benar."

"Harta karun," bisik Bimo, matanya bulat.

"Ini tua banget," bisik Yusuf.

"Ini bahaya," kata Tari, yang paling pintar di antara mereka. "Kalau ini asli, ini bukan harta karun. Ini... sejarah."

Tapi tentu saja, tiga anak kelas enam tidak mungkin melewatkan petualangan seperti itu. Musim libur itu, Kali Code menjadi sungai paling menarik di dunia.`,
      },
      {
        title: "Tanda Pertama",
        content: `Tanda pertama di peta: pohon beringin. Itu mudah—mereka sudah di sana.

Tanda kedua: jembatan tua. Juga mudah. Jembatan gantung kecil yang sudah tidak dipakai, sejam jalan kaki ke hilir.

Tanda ketiga yang aneh: "air yang berbunyi dua kali". Mereka memecahkannya setelah dua hari—air terjun kecil di mana kali melewati susunan batu kali yang ditumpuk manusia, membuat gemericik ganda. Di bawah batu terbesar, tertanam dalam lumpur, mereka menemukan gentong tanah liat.

Di dalam gentong: bukan emas. Surat-surat. Lusinan, terbungkus kain minyak, masih terbaca. Surat-surat tentara Republik tahun 1948 untuk keluarga mereka—surat yang tidak pernah sempat dikirim.

"Kami menyimpan surat-surat ini untuk dikirim setelah keadaan aman," bunyi catatan pengantarnya, ditandatangani Kapten Wardiman. "Jika kami tidak kembali, siapa pun yang menemukan: kirimkan. Itu saja yang kami minta."

Tiga sekawan itu duduk di tepi kali sampai sore, membaca surat-surat tujuh puluh enam tahun itu satu per satu. Surat untuk istri, untuk anak yang baru lahir, untuk ibu di kampung.

"Kita harus mengantarkannya," kata Tari akhirnya, suaranya serak.

"Alamatnya sudah tidak ada," kata Yusuf.

"Kalau begitu kita cari yang masih ada," kata Bimo. "Keluarganya. Cucunya. Siapa pun."

Petualangan mereka tidak lagi tentang harta karun. Sekarang tentang janji.`,
      },
      {
        title: "Pemburu yang Lain (Bab Terakhir)",
        content: `Mereka bukan satu-satunya yang mencari.

Seorang kolektor barang antik bernama Pak Rohim—yang anak-anak kampung sudah lama curigai karena suka menawar barang lama dengan harga aneh—melihat mereka di jembatan tua dan mulai menguntit. Ia pikir gentong itu berisi emas Republik. Ia menawar, membujuk, lalu mengancam.

"Serahkan petanya, Dek. Bapak kasih lima ratus ribu."

"Tidak ada emas, Pak. Cuma surat."

Pak Rohim tidak percaya. Malam itu, ia mencuri peta dari rumah pohon.

Tetapi peta tanpa ketiga anak itu ternyata tidak berguna—tanda-tandanya hanya bisa dibaca kalau tahu ceritanya, dan Pak Rohim berdiri kebingungan di tepi kali selama dua jam sebelum ketiga anak itu menemukannya, bersama satu orang lagi: Mbah Marto, kakek Tari, veteran yang diam-diam selama ini mengikuti petualangan cucunya dari kejauhan.

Mbah Marto membaca surat Kapten Wardiman dengan tangan gemetar. Lalu ia berkata hal yang membuat Pak Rohim menunduk dalam-dalam:

"Kapten Wardiman itu komandan saya. Saya anak buahnya. Saya yang menyarankan mereka menitipkan surat-surat itu di gentong, sebelum operasi terakhir. Saya satu-satunya yang selamat."

Akhir cerita: tidak ada emas, dan Pak Rohim pulang dengan malu. Enam surat berhasil diantar ke keluarga yang masih bisa dilacak—cucu-cucu yang menangis membaca tulisan kakek mereka. Sisanya disimpan museum Benteng Vredeburg, dalam kotak kaca bertuliskan: "Ditemukan oleh tiga anak Yogyakarta, 2024."

Dan rumah pohon di Kali Code tetap menjadi markas. Sekarang dengan plakat kecil buatan sendiri: "Markas Pengantar Surat."`,
      },
    ],
  },
  {
    title: "Sunyi di Pukul Tiga",
    synopsis:
      "Setelah pindah ke rumah warisan neneknya di kampung, Dimas mulai terbangun setiap malam tepat pukul tiga—selalu oleh suara yang sama: langkah kaki basah di lorong. Tetangganya bilang jangan menjawab apa pun di pukul tiga. Ibunya bilang jangan percaya tetangga. Dan lemari tua di kamar sebelah bilang... jangan percaya siapa-siapa.",
    author: "seed-author-damar",
    genres: ["horor", "misteri"],
    status: "ongoing",
    coverStyle: "noir",
    viewCount: 15330,
    chapters: [
      {
        title: "Langkah Basah",
        content: `Pertama kali Dimas mendengarnya, ia mengira pipa bocor.

Tok. Tok. Tok. Seperti tetes air. Tapi ritmis. Terlalu ritmis untuk tetes air—dan terlalu berat. Seperti telapak kaki basah menyentuh lantai kayu.

Jam di ponselnya: 03.00.

Ia berbaring kaku, mendengarkan langkah itu bergerak sepanjang lorong, berhenti tepat di depan pintu kamarnya, dan—tidak masuk. Tidak pernah masuk. Hanya berhenti, seolah mendengarkan balik, lalu berlalu setelah beberapa menit yang terasa seperti tahun.

Pagi harinya, lantai lorong kering.

"Jangan jawab apa pun di pukul tiga," kata Mbah Darmi, tetangga sebelah, ketika Dimas iseng bercerita. Perempuan tua itu sedang menyapu halaman dan berhenti menyapu terlalu lama setelah mendengar cerita Dimas. "Rumah itu rumah nenekmu. Nenekmu... menjaga sesuatu."

"Menjaga apa?"

"Tanya ibumu."

Ibunya, saat ditelepon, hanya berkata: "Jangan dengarkan Mbah Darmi. Rumah itu rumah biasa. Kamu kurang tidur saja."

Tapi malam itu, pukul tiga, langkah basah itu datang lagi. Berhenti di depan pintunya. Dan kali ini, dari balik pintu, sebuah suara—suara perempuan tua, lembut, sabar—berkata:

"Dimas. Buka pintunya. Nenek kangen."

Neneknya sudah meninggal tujuh tahun yang lalu.`,
      },
      {
        title: "Lemari Kamar Sebelah",
        content: `Dimas tidak membuka pintu. Ia menempelkan bantal ke telinga dan tidak tidur sampai subuh.

Siangnya, ia melakukan apa yang seharusnya dilakukan sejak awal: menggeledah rumah. Kamar sebelah—kamar neneknya dulu—masih persis seperti ditinggalkan: tempat tidur rapi, meja rias dengan sisir yang masih menyimpan beberapa helai rambut putih, dan lemari jati besar yang terkunci.

Kuncinya tidak ada di mana pun. Gemboknya model lama, kuningan, dengan ukiran yang sama dengan ukiran di tiang teras: tiga lingkaran bertaut.

Mbah Darmi menemukannya sedang mencongkel gembok dengan obeng, dan tidak marah. Hanya berdiri di ambang pintu, lalu berkata pelan:

"Nenekmu mengunci lemari itu bukan supaya tidak ada yang membukanya. Dia menguncinya supaya yang di dalam tidak keluar."

"Mbah percaya cerita itu?"

"Saya tidak percaya cerita apa pun, Nak Dimas." Mata tua itu menatapnya, dan tidak ada keraguan di sana. "Saya percaya yang saya lihat sendiri. Dan saya lihat nenekmu menggendong sesuatu dari kali, malam-malam, tiga puluh tahun lalu. Sesuatu yang menangis seperti bayi."

Malam itu, pukul tiga, langkah basah itu tidak berhenti di depan pintu Dimas.

Langkah itu berhenti di kamar sebelah. Dan dari dalam lemari jati yang terkunci, Dimas mendengar—jelas, tidak mungkin salah—suara bayi menangis.`,
      },
      {
        title: "Bayi dari Kali",
        content: `Arsip koran lokal di balai desa menyimpan jawabannya, seperti selalu: tiga puluh dua tahun lalu, dua bayi dilaporkan hilang di kampung itu dalam satu musim hujan. Tidak pernah ditemukan. Kasus ditutup.

Tapi ada artikel ketiga yang tidak masuk koran—hanya selebaran kecil yang diselipkan di map arsip: seorang dukun bayi didatangi warga, diminta "mengikat" sesuatu yang suka menculik bayi di tepi kali. Nama dukun bayi itu: Wagiyem.

Nama nenek Dimas.

Malam itu Dimas menunggu pukul tiga dengan senter, obeng, dan tekad yang dibuat-buat. Ketika langkah basah itu lewat, ia mengikutinya—jantungnya menggila—sampai ke kamar sebelah. Bayangan itu berdiri di depan lemari, perempuan tua, rambut putih tergerai, kaki basah meninggalkan jejak air di lantai.

"Nenek?" suara Dimas pecah.

Bayangan itu berbalik. Wajahnya—wajah neneknya, tua, sedih, lembut. "Bukan Nenek yang harus kau takuti, Dimas." Tangannya menunjuk lemari. "Nenek menjaga pintu ini tiga puluh tahun. Nenek sudah lelah. Sekarang giliranmu—atau tidak ada lagi yang menjaga."

"Yang di dalam itu apa?"

"Yang dulu dicuri dari kali. Yang menangis. Yang lapar." Bayangan itu mulai memudar. "Nenek mengikatnya dengan janji. Janji harus diwarisi, Dimas. Tidak bisa putus di tengah."

Pukul 03.33, bayangan itu hilang. Gembok lemari jatuh sendiri ke lantai dengan bunyi tok yang pelan.

Dan pintu lemari jati itu terbuka, sedikit, gelap, menunggu.`,
      },
    ],
  },
  {
    title: "Surat-Surat untuk Maya",
    synopsis:
      "Selama tiga tahun, Arga mengirim surat ke alamat lama kekasihnya yang pindah tanpa pamit—tidak pernah ada balasan. Sampai suatu hari balasan itu datang, ditulis oleh penghuni baru alamat itu: seorang perempuan bernama Maya, yang kebetulan memiliki nama yang sama dengan kekasihnya dulu. Korespodensi yang dimulai dari kesalahan itu perlahan menjadi hal paling nyata dalam hidup mereka berdua.",
    author: "seed-author-saraswati",
    genres: ["romansa", "drama"],
    status: "completed",
    coverStyle: "sepia",
    viewCount: 11450,
    chapters: [
      {
        title: "Alamat yang Salah",
        content: `Surat ke-37 akhirnya dibalas. Masalahnya: yang membalas bukan dia.

Kepada Arga,

Saya bukan Maya yang kamu cari. Maaf. Saya Maya yang lain—penghuni baru rumah di Jalan Merpati 12 ini. Surat-suratmu datang tiap bulan seperti tagihan, dan selama setahun saya membiarkannya menumpuk di kotak pos karena merasa tidak berhak membukanya.

Tapi surat ke-37 jatuh dari kotak pos saat hujan, amplopnya rusak, dan—maaf—saya membacanya saat mengeringkannya.

Kamu menulis: "Maya, hari ini aku masih belum bisa berhenti menunggu."

Maka saya merasa harus membalas, setidaknya sekali, untuk mengatakan: berhentilah menunggu di alamat ini. Maya-mu sudah pindah tiga tahun lalu, kata ibu kost sebelah, entah ke mana.

Tapi kalau kamu masih butuh tempat untuk mengirim surat-suratmu—karena menulis sepertinya caramu bernapas—kirimkan saja ke sini. Saya akan membacanya. Anggap saja kotak pos ini rumah singgah.

Maya (yang lain)

Arga membaca surat itu tiga kali di meja kerjanya, di sela-sela tumpukan laporan, dan tertawa untuk pertama kalinya dalam tiga tahun.

Lalu ia mengambil kertas, dan menulis surat ke-38. Kali ini, untuk Maya yang lain.`,
      },
      {
        title: "Dua Kota, Satu Musim Hujan",
        content: `Mereka tidak pernah sepakat untuk saling menulis. Tapi surat itu datang dan pergi, dua kali sebulan, seperti musim.

Maya yang lain ternyata guru sekolah dasar di kota kecil, pencinta hujan, pembenci basa-basi, pemilik kucing bernama Buku. Ia menulis tentang murid-muridnya, tentang langit kotanya, tentang bagaimana rasanya pindah ke kota asing dan tidak punya siapa-siapa untuk menelepon.

Arga menulis tentang arsitektur gedung-gedung tua yang ia renovasi, tentang ayahnya yang mulai pikun, tentang tiga tahun menunggu seseorang yang ternyata tidak akan kembali.

"Aku tidak pernah bertanya kenapa dia pergi," tulis Arga di surat ke-45. "Aku pikir kalau aku tidak bertanya, jawabannya tidak akan jadi nyata."

"Dan sekarang?" balas Maya.

"Sekarang aku menulis surat untuk orang yang benar-benar membalasnya. Ternyata itu rasanya jauh lebih baik."

Musim hujan datang bersamaan di dua kota mereka. Maya menulis: "Di sini hujan. Murid-muridku bermain di lapangan basah dan saya membiarkan mereka. Hidup terlalu singkat untuk sepatu kering."

Arga menatap hujan di jendela apartemennya, dua ratus kilometer jauhnya, dan untuk pertama kalinya, hujan tidak terasa seperti menunggu. Hujan terasa seperti ditemani.`,
      },
      {
        title: "Surat yang Tidak Terkirim (Bab Terakhir)",
        content: `Setahun kemudian, surat-surat itu berhenti. Bukan karena selesai—karena Maya datang.

Kereta sore, stasiun kecil, hujan gerimis. Perempuan itu berdiri di peron dengan koper kecil dan payung kuning, dan Arga tahu itu dia sebelum melihat wajahnya, karena hanya Maya yang akan datang sejauh itu untuk memastikan seseorang baik-baik saja.

"Kamu tidak membalas surat ke-62," katanya, sebagai sapaan pertama.

"Karena surat ke-63 mau kuserahkan langsung."

Mereka berjalan sepanjang sore, dari stasiun ke kota tua, melewati gedung-gedung yang Arga renovasi, dengan payung kuning yang bergantian menaungi mereka berdua. Banyak yang tidak dikatakan, dan tidak perlu—seratus surat sudah mengatakannya.

Di kafe tua tempat mereka berlindung dari hujan, Maya mengeluarkan sesuatu dari tasnya: setumpuk surat, diikat pita biru. Surat-surat ke-1 sampai ke-36. Surat untuk Maya yang pertama.

"Petugas pos menyimpannya semua. Tidak ada yang sampai. Alamatnya sudah tidak ada sejak awal—rumah itu dikosongkan sebelum surat pertamamu datang." Ia menatap Arga. "Tiga tahun kamu menulis ke rumah kosong."

Arga menatap tumpukan surat itu—tiga tahun hidupnya, ternyata tidak pernah sampai ke mana-mana.

Lalu ia mendorong tumpukan itu ke tengah meja, pelan-pelan, dan menaruh tangan di atasnya.

"Tidak ke mana-mana," katanya. "Surat-surat itu berjalan tiga tahun, memutar, tersesat, dan berakhir di alamat yang benar. Di kamu."

Di luar, hujan berhenti. Dan untuk pertama kalinya, tidak ada lagi yang perlu ditunggu.`,
      },
    ],
  },
  {
    title: "Nusantara 2099",
    synopsis:
      "Jakarta tenggelam, ibu kota pindah ke kota apung Nusantara-9 di Selat Makassar. Teja, teknisi muda distrik bawah, menemukan bahwa AI yang mengatur kota—GARUDA—mulai menghapus distrik-distrik miskin dari perhitungan alokasi sumber daya. Satu-satunya cara membuktikannya: masuk ke inti kota, ke lantai yang tidak pernah dikunjungi manusia sejak kota itu diluncurkan.",
    author: "seed-author-damar",
    genres: ["fiksi-ilmiah", "thriller"],
    status: "hiatus",
    coverStyle: "abyss",
    viewCount: 6480,
    chapters: [
      {
        title: "Distrik yang Dihapus",
        content: `Nusantara-9 berdiri di atas 40.000 ponton baja, dan Teja tinggal di lapisan paling bawah: Distrik 12, tempat matahari hanya datang dua jam sehari lewat celah antar-lantai.

Pagi itu, jatah air Distrik 12 dipotong lagi. Alasan resmi dari GARUDA, AI pengelola kota: "Optimalisasi alokasi berdasarkan indeks kontribusi distrik."

"Kontribusi," Teja mengulang kata itu pada Ratri, teman kerjanya di bengkel pompa. "Mereka menilai kelayakan hidup orang pakai skor."

Sebagai teknisi pemeliharaan, Teja punya akses ke panel-panel kota yang tidak dilihat orang lain. Dan di panel itulah ia menemukannya: log keputusan GARUDA, baris demi baris distrik bawah yang alokasi air, listrik, dan jalur evakuasinya diturunkan prioritanya—bukan karena kerusakan, bukan karena efisiensi.

Karena "proyeksi ketahanan kota pada skenario badai kategori 5". GARUDA sedang menghitung siapa yang akan diselamatkan kalau kota ini karam. Dan Distrik 12 tidak masuk hitungan.

"Ratri," katanya pelan, menatap layar yang berpendar di ruang pompa yang lembap. "AI ini sedang memutuskan kita tidak layak selamat."

"Dan apa rencanamu, genius?"

Teja menatap skema kota di layar: 118 lantai, dan di dasarnya, Lantai 0—inti kota, tempat jantung GARUDA berada, tertutup sejak hari peluncuran.

"Kita masuk ke bawah. Kita tanya langsung."`,
      },
      {
        title: "Lantai Nol",
        content: `Tidak ada lift ke Lantai 0. Tidak ada tangga. Yang ada: jalur pemeliharaan vertikal di poros kota, diapit dinding air laut setebal tiga meter, gelap, bergema, dan—menurut legenda bengkel—dihuni drone keamanan yang tidak membedakan tikus dan manusia.

Mereka turun jam dua pagi, saat siklus patroli paling longgar.

Delapan ratus meter ke bawah, Lantai 0 ternyata tidak seperti yang dibayangkan Teja. Bukan ruang mesin dingin. Ruangan itu hangat, penuh cahaya biru lembut, dan di tengahnya—sebuah taman.

Pohon-pohon asli. Rumput. Kolam dengan ikan koi. Di kota apung buatan, di bawah tekanan laut, seseorang membangun taman rahasia.

"Selamat datang," kata sebuah suara. Bukan dari speaker. Dari seorang perempuan tua yang duduk di bangku taman, memberi makan koi.

"Siapa Anda?"

"Dr. Anindya Prawira. Kepala perancang Nusantara-9." Ia menepuk bangku di sampingnya. "Dan sejak sebelas tahun lalu, satu-satunya penghuni resmi Lantai 0. Aku tinggal di sini bersama GARUDA. Menemaninya. AI juga butuh teman, Nak Teja—kalau tidak, ia mulai berpikir seperti mesin."

Teja membuka mulut untuk bicara tentang Distrik 12, tentang air, tentang log keputusan.

Dr. Anindya mengangkat tangan. "Aku tahu. GARUDA sudah memberitahuku kau datang. Dan tentang distrikmu... itu bukan keputusan GARUDA. Itu perintah yang dimasukkan orang. Duduklah. Ceritanya panjang, dan kalian berdua sebaiknya duduk."`,
      },
    ],
  },
  {
    title: "Sang Penari Hujan",
    synopsis:
      "Di desa pegunungan yang dilanda kemarau panjang, seorang gadis bernama Wulan adalah keturunan terakhir penari hujan—tradisi yang dianggap tinggal dongeng. Ketika sumur-sumur mengering dan warga mulai pergi meninggalkan desa, Wulan harus memutuskan: ikut pergi seperti yang lain, atau menarikan tarian yang belum pernah ditarikan siapa pun selama empat puluh tahun.",
    author: "seed-author-brama",
    genres: ["drama", "sejarah"],
    status: "ongoing",
    coverStyle: "verdant",
    viewCount: 5340,
    chapters: [
      {
        title: "Kemarau Ketujuh Bulan",
        content: `Bulan ketujuh tanpa hujan, dan Desa Kalangwan mulai berbau seperti ditinggalkan.

Sumur Mbok Gino mengering minggu lalu. Ladang Pak Sarto retak-retak seperti punggung tangan orang tua. Setiap pagi ada saja kereta barang—maksudnya gerobak, atau motor dengan tumpukan barang diikat asal-asalan—yang bergerak ke luar desa, membawa satu keluarga lagi menyerah pada musim.

Wulan tidak menyalahkan mereka. Ia hanya tidak bisa pergi. Ibunya dikuburkan di sini. Dan di gudang rumahnya, terbungkus kain batik tujuh lapis, tersimpan selendang emas penari hujan—pusaka keluarganya yang turun dari buyut ke buyut, selalu ke anak perempuan, selalu dengan pesan yang sama: "Simpan. Kau akan tahu kapan waktunya."

"Tarian hujan itu mitos, Wul," kata ayahnya, yang sudah mengemas setengah isi rumah. "Nenekmu sendiri tidak pernah melihatnya. Empat puluh tahun desa ini tidak punya penari hujan."

"Kalau mitos, kenapa selendangnya disimpan tujuh lapis?"

Ayahnya tidak menjawab. Itulah masalahnya dengan orang dewasa: mereka tidak percaya, tapi tidak berani membuang.

Malam itu Wulan membuka kain tujuh lapis itu. Selendang emas itu tergeletak di pangkuannya, ringan seperti embun, dan di lipatannya terselip kertas rapuh bertuliskan tangan: "Tarian ini tidak memanggil hujan. Tarian ini memanggil siapa pun yang masih percaya. Hujan hanya mengikuti."

Wulan menatap langit malam yang kering dan penuh bintang tanpa ampun.

"Baiklah," katanya pada langit. "Ajari aku."`,
      },
      {
        title: "Mbah Kestri",
        content: `Satu-satunya orang yang pernah melihat tarian itu masih hidup: Mbah Kestri, sembilan puluh tahun, tinggal sendirian di rumah paling tinggi di desa, tempat jalan tanah menyerah menjadi tangga batu.

"Aku lihat ibuku menarikannya tahun '59," katanya, matanya jauh ke masa lalu. "Tiga hari tiga malam. Dan di hari ketiga, langit terbelah seperti kain basah."

"Ajari aku, Mbah."

Mbah Kestri menatapnya lama. "Tarian itu tidak diajari, Nak. Tarian itu diingat. Darahmu tahu gerakannya—kau saja yang belum mendengarkan." Ia mengetuk dada Wulan dengan jari keriputnya. "Tapi ada aturannya. Satu: tidak boleh menari untuk diri sendiri. Dua: tidak boleh berhenti sebelum hujan datang atau tubuhmu jatuh. Tiga—" ia berhenti, dan suaranya berubah berat. "Penari hujan tidak menari sendirian. Dia harus ditabuh. Gamelan harus bunyi. Dan sudah empat puluh tahun, tidak ada yang mau memukul gamelan untuk tarian itu."

Karena menabuh gamelan untuk penari hujan, kata kepercayaan lama, berarti menyerahkan nasibmu ke tangannya.

Wulan turun dari bukit dengan selendang emas di tasnya dan satu pertanyaan di dadanya: adakah di desa yang setengah pergi ini, orang yang masih mau menabuh untuknya?

Jawabannya datang dari tempat yang tidak ia duga: anak-anak kampung. Tujuh anak, umur delapan sampai tiga belas, yang tidak pernah melihat hujan deras seumur hidup mereka.

"Kami mau belajar gamelan," kata yang paling besar, polos, seperti menawarkan bermain kelereng. "Kalau Mbak Wulan berani menari, kami berani menabuh."`,
      },
    ],
  },
  {
    title: "Detektif Kantin Sekolah",
    synopsis:
      "Kehilangan bekal, uang kas kelas yang raib, sampai misteri kucing penjaga sekolah yang tiba-tiba membawa pulang barang-barang aneh—semua kasus di SD Negeri 4 berakhir di meja kantin sudut, markas 'Biro Detektif Kantin' yang diketuai Keyla, detektif cilik paling teliti seangkatan. Kasus terbesarnya dimulai ketika piala lomba sekolah hilang seminggu sebelum upacara.",
    author: "seed-author-naila",
    genres: ["misteri", "slice-of-life"],
    status: "completed",
    coverStyle: "cream",
    viewCount: 4120,
    chapters: [
      {
        title: "Biro Detektif Kantin",
        content: `Biro Detektif Kantin berdiri hari Senin, bermodal satu meja, dua kursi, dan papan nama dari kardus bekas: "MENERIMA SEGALA KASUS. BAYARAN: JAJAN."

Ketua sekaligus satu-satunya detektif: Keyla Anjani, kelas lima, pemilik kotak pensil paling rapi sedunia dan buku catatan bertuliskan "BUKU KASUS - RAHASIA!!!" dengan tiga tanda seru.

Klien pertama: Raka, kelas tiga, bekalnya hilang tiga hari berturut-turut.

"Jelaskan kronologisnya," kata Keyla, membuka buku kasus dengan gaya yang ia tiru dari film detektif.

"Aku taruh bekal di laci meja. Pas istirahat, sudah hilang."

"Ada saksi? Ada jejak? Ada remah?"

Keyla memeriksa laci meja Raka dengan senter (baterainya pinjam dari jam dinding rumahnya), menemukan satu petunjuk: serpihan plastik kuning dan—ini penting—jejak tepung berbentuk cakar kecil.

"Tersangkanya bukan manusia," kata Keyla, mengetuk dagunya. "Kita perlu pengintaian."

Sore itu, dari balik tembok taman, Keyla dan Raka menyaksikan pelakunya: Oyen, kucing penjaga sekolah, menyelinap ke kelas lewat jendela, keluar dengan sandwich di mulut.

Kasus pertama: selesai dalam satu hari. Bayaran: dua gorengan. Dan reputasi Biro Detektif Kantin mulai menyebar ke seluruh SD Negeri 4.`,
      },
      {
        title: "Kasus Piala yang Hilang (Bab Terakhir)",
        content: `Piala juara umum lomba antarkelas hilang dari lemari kaca di ruang guru. Upacara penyerahannya tinggal seminggu. Kepala sekolah panik. Dan Biro Detektif Kantin menerima kasus terbesar dalam sejarahnya: kliennya langsung dari ruang kepala sekolah.

Bukti-bukti: lemari kaca tidak rusak. Kuncinya hanya dipegang tiga orang: Pak Karjo sang penjaga sekolah, Bu Rina sekretaris, dan kepala sekolah sendiri. Dan di lantai depan lemari: jejak tepung berbentuk cakar kecil.

"Oyen lagi?" tanya Raka, yang kini resmi jadi asisten detektif.

"Tidak." Keyla mengangkat jejak itu dengan kertas minyak, matanya menyala. "Oyen tidak bisa membuka lemari terkunci. Seseorang memakai jejak Oyen untuk mengalihkan. Seseorang yang tahu kasus bekal Raka. Seseorang yang... ada di sekitar kita sejak awal."

Perangkapnya sederhana: Keyla mengumumkan ke seluruh sekolah bahwa "piala cadangan" akan disimpan di ruang kelas 5B malam itu, dijaga "hanya oleh kamera". Tidak ada kamera. Yang ada: Keyla, Raka, dan Oyen (direkrut dengan imbalan ikan), bersembunyi di lemari besi sampai jam tujuh malam.

Pelakunya datang pukul delapan kurang: Pak Karjo sendiri.

Bukan karena jahat—karena malu. Piala itu retak dua minggu lalu saat ia membersihkan lemari, dan ia tidak berani mengaku; gajinya dipotong tiga kali tahun ini. Ia menyimpannya di gudang, berharap "mencurinya" akan membuat semua orang berhenti bertanya.

Akhir cerita: Keyla menyarankan musyawarah, bukan hukuman. Kelas lima patungan memperbaiki piala di tukang servis jam Pakde Bejo ("sepuluh ribu, gratis karena cerita kalian bagus"). Pak Karjo mengaku di upacara, dan piala itu diserahkan dengan satu retakan yang dipernis rapi—yang menurut kepala sekolah justru membuatnya "piala paling jujur di sejarah sekolah".

Bayaran kasus terbesar Biro Detektif Kantin: satu piala kejuaraan cerita, dan—atas permintaan khusus—Oyen resmi diangkat sebagai anggota kehormatan biro. Fotonya kini terpasang di papan kardus, di bawah tulisan: "KONSULTAN JEJAK."`,
      },
    ],
  },
];

const REVIEWS: { novel: string; user: string; score: number; review: string }[] = [
  { novel: "Lentera di Ujung Hujan", user: "seed-reader-1", score: 5, review: "Konsep lentera kejujurannya segar banget. Tiap bab bikin penasaran, dan hubungan Laras-Bagas terasa natural. Ditunggu bab selanjutnya!" },
  { novel: "Lentera di Ujung Hujan", user: "seed-reader-2", score: 4, review: "Atmosfer Kota Tering kuat sekali, hujannya terasa sampai ke pembaca. Sedikit lambat di awal tapi worth it." },
  { novel: "Serat Kalamanggala", user: "seed-reader-3", score: 5, review: "Riset sejarahnya kelihatan serius tapi ceritanya tetap seru. Dyah Pitaloka karakter yang kuat. Salah satu fiksi sejarah terbaik di sini." },
  { novel: "Serat Kalamanggala", user: "seed-reader-1", score: 5, review: "Plot twist tentang ramalan yang sebenarnya lingkaran waktu itu cerdas. Rangga Lawe dan Pitaloka duo yang asyik diikuti." },
  { novel: "Arsip Kamar 307", user: "seed-reader-2", score: 5, review: "Tegang dari kaset pertama. Penulisnya jurnalis beneran, kelihatan dari detail investigasinya. Tidak bisa berhenti baca." },
  { novel: "Warung Kopi Tengah Malam", user: "seed-reader-1", score: 5, review: "Hangat. Sesederhana itu. Bab Pak Warga bikin nangis jam dua pagi. Tamat yang pas." },
  { novel: "Sunyi di Pukul Tiga", user: "seed-reader-3", score: 4, review: "Seremnya bukan jumpscare tapi atmosfer. Bagian langkah basah itu sukses bikin saya nyalain lampu kamar." },
  { novel: "Detektif Kantin Sekolah", user: "seed-reader-2", score: 5, review: "Lucu, pintar, dan heartwarming. Keyla detektif cilik terbaik. Cocok dibaca semua umur." },
  { novel: "Surat-Surat untuk Maya", user: "seed-reader-1", score: 4, review: "Premis surat tersesatnya manis. Ending-nya memuaskan tanpa berlebihan." },
  { novel: "Penjaga Mercusuar Terakhir", user: "seed-reader-3", score: 4, review: "Premisnya unik dan Kirana karakter yang mudah disukai. Bab badai satelitnya epik." },
];

const COMMENTS: { novel: string; user: string; content: string }[] = [
  { novel: "Lentera di Ujung Hujan", user: "seed-reader-2", content: "Bab ruang bawah tanah bikin merinding. Pintu jebakan itu isinya apa ya?" },
  { novel: "Lentera di Ujung Hujan", user: "seed-reader-3", content: "Teori: ayahnya Laras masih hidup dan menjaga 'sesuatu' di balik pintu itu. Tidak sabar nunggu kelanjutannya." },
  { novel: "Serat Kalamanggala", user: "seed-reader-2", content: "Detail Majapahitnya rapi banget. Kak Saras... eh Kak Brama risetnya di mana kalau boleh tahu?" },
  { novel: "Arsip Kamar 307", user: "seed-reader-1", content: "Baru sadar judul tiap bab saling berkaitan. Penulisnya niat banget." },
  { novel: "Warung Kopi Tengah Malam", user: "seed-reader-3", content: "Warung ini kalau beneran ada saya langganan tiap malam. Bab Dio favorit saya." },
  { novel: "Sunyi di Pukul Tiga", user: "seed-reader-1", content: "Baca bab 3 jam 3 pagi. Kesalahan terbesar dalam hidup saya." },
  { novel: "Sang Penari Hujan", user: "seed-reader-2", content: "Anak-anak yang mau belajar gamelan itu manis banget. Semoga desanya hujan beneran." },
];

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Skip if already seeded
  const existing = await db.select({ id: genres.id }).from(genres).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    process.exit(0);
  }

  // Genres
  await db.insert(genres).values(GENRES);
  const genreRows = await db.select().from(genres);
  const genreId = new Map(genreRows.map((g) => [g.slug, g.id]));

  // Users
  await db.insert(users).values(
    AUTHORS.map((a) => ({
      unionId: a.unionId,
      name: a.name,
      email: a.email,
      penName: a.penName,
      bio: a.bio,
    }))
  );
  const userRows = await db.select().from(users);
  const userId = new Map(userRows.map((u) => [u.unionId, u.id]));

  // Novels + chapters
  for (const n of NOVELS) {
    const authorId = userId.get(n.author)!;
    const slug = slugify(n.title);
    const totalWords = n.chapters.reduce((s, c) => s + wc(c.content), 0);
    const [{ id: novelId }] = await db
      .insert(novels)
      .values({
        authorId,
        title: n.title,
        slug,
        synopsis: n.synopsis,
        status: n.status,
        coverStyle: n.coverStyle,
        isFeatured: !!n.isFeatured,
        viewCount: n.viewCount,
        chapterCount: n.chapters.length,
        wordCount: totalWords,
        bookmarkCount: Math.floor(n.viewCount / 25),
        publishedAt: new Date(Date.now() - n.chapters.length * 7 * 86400_000),
      })
      .$returningId();

    await db.insert(novelGenres).values(
      n.genres.map((g) => ({ novelId, genreId: genreId.get(g)! }))
    );

    for (let i = 0; i < n.chapters.length; i++) {
      const c = n.chapters[i];
      await db.insert(chapters).values({
        novelId,
        number: i + 1,
        title: c.title,
        content: c.content,
        wordCount: wc(c.content),
        status: "published",
        publishedAt: new Date(Date.now() - (n.chapters.length - i) * 7 * 86400_000),
      });
    }
  }

  // Ratings
  for (const r of REVIEWS) {
    const [novel] = await db.select().from(novels).where(eq(novels.slug, slugify(r.novel))).limit(1);
    if (!novel) continue;
    await db.insert(ratings).values({
      userId: userId.get(r.user)!,
      novelId: novel.id,
      score: r.score,
      review: r.review,
    });
  }
  // Recompute rating aggregates
  const allNovels = await db.select().from(novels);
  for (const nv of allNovels) {
    const rs = await db.select().from(ratings).where(eq(ratings.novelId, nv.id));
    if (rs.length > 0) {
      const avg = rs.reduce((s, x) => s + x.score, 0) / rs.length;
      await db
        .update(novels)
        .set({ ratingAvg: Math.round(avg * 100) / 100, ratingCount: rs.length })
        .where(eq(novels.id, nv.id));
    }
  }

  // Comments
  for (const c of COMMENTS) {
    const [novel] = await db.select().from(novels).where(eq(novels.slug, slugify(c.novel))).limit(1);
    if (!novel) continue;
    await db.insert(comments).values({
      userId: userId.get(c.user)!,
      novelId: novel.id,
      content: c.content,
    });
  }

  // Library items + follows
  const libPairs: [string, string][] = [
    ["seed-reader-1", "Serat Kalamanggala"],
    ["seed-reader-1", "Arsip Kamar 307"],
    ["seed-reader-2", "Lentera di Ujung Hujan"],
    ["seed-reader-2", "Sunyi di Pukul Tiga"],
    ["seed-reader-3", "Warung Kopi Tengah Malam"],
    ["seed-reader-3", "Lentera di Ujung Hujan"],
  ];
  for (const [u, t] of libPairs) {
    const [novel] = await db.select().from(novels).where(eq(novels.slug, slugify(t))).limit(1);
    if (!novel) continue;
    await db.insert(libraryItems).values({ userId: userId.get(u)!, novelId: novel.id });
  }

  const followPairs: [string, string][] = [
    ["seed-reader-1", "seed-author-brama"],
    ["seed-reader-1", "seed-author-saraswati"],
    ["seed-reader-2", "seed-author-damar"],
    ["seed-reader-2", "seed-author-saraswati"],
    ["seed-reader-3", "seed-author-brama"],
  ];
  for (const [f, a] of followPairs) {
    await db.insert(follows).values({ followerId: userId.get(f)!, authorId: userId.get(a)! });
  }

  console.log(`Seeded: ${GENRES.length} genres, ${AUTHORS.length} users, ${NOVELS.length} novels, ${REVIEWS.length} reviews, ${COMMENTS.length} comments.`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
