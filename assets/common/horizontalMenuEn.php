<?php
echo '<div class="d-md-inline-block">	';
if ((($_SERVER['SERVER_ADDR'] === '127.0.0.1') || ($_SERVER['SERVER_NAME'] === 'localhost')) && (!preg_match('/(new)(\?.*)?$/', basename($_SERVER['REQUEST_URI'])))) {
echo '<a class="text-decoration-none mx-1" href="/ru/new">
<figure class="figure text-decoration-none">
  <i class="menu-icon icon-item fa-solid fa-magnifying-glass fa-flip-horizontal"></i>
  <figcaption class="horiz-menu-item figure-caption text-center">Fdg New!!!</figcaption>
</figure>
</a>';
}

 if (preg_match('/(read\.php|new)(\?.*)?$/', basename($_SERVER['REQUEST_URI']))) {
    
echo '<a title="Search (Ctrl+1)" id="Search" class="dropup text-decoration-none mx-1 d-md-inline-block" href="' . $mainpage . '">
<figure class="figure text-decoration-none">
  <i class="menu-icon icon-item fa-solid fa-magnifying-glass fa-flip-horizontal"></i>
  <figcaption class="horiz-menu-item figure-caption text-center">' . $searchcaption . '</figcaption>
</figure>
</a>';
} 
if (strpos($_SERVER['REQUEST_URI'], "read.php") === false) {
echo ' 
<a title="Read (Ctrl+2)" class="dropdown text-decoration-none mx-1 d-md-inline-block" id="MenuRead" href="' . $mainreadlink . '">
<figure class="figure text-decoration-none">
  <i class="menu-icon fa-solid fa-book-bookmark"></i>
  <figcaption class="horiz-menu-item figure-caption text-center">Read Pāḷi</figcaption>
</figure>
</a>';
} /*else {
 echo ' <a class="text-decoration-none mx-1" href="' . $readerPage . '">
<figure class="figure text-decoration-none">
    <i class="menu-icon fa-solid fa-bolt"></i>
<figcaption class="horiz-menu-item figure-caption text-center">Pāḷi Index</figcaption>
</figure>
</a>' ;
} */

echo '<!--
<a class="dropup text-decoration-none mx-1 d-md-inline-block"  data-bs-toggle="dropdown" aria-expanded="false" href="#">
<figure class="figure dropup">
  <i class="menu-icon fa-solid fa-book-bookmark"></i>
<figcaption class="horiz-menu-item figure-caption text-center">Pāḷi Texts</figcaption>   
</figure>	  
</a>
  <ul class="dropdown-menu" aria-labelledby="MenuRussian">
    <li><a class="dropdown-item" target=""  href="' . $mainreadlink . '">Table of Content</a></li>
    <li><a class="dropdown-item" target=""  href="' . $readerPage . '">SC Light</a></li>
  </ul>
-->
<a title="External Pali Resources" class="dropdown text-decoration-none mx-1 d-md-inline-block" id="MenuEnglish" data-bs-toggle="dropdown" aria-expanded="false" href="#">
<figure class="figure d-md-inline-block">
    <i class="menu-icon fa-solid fa-link"></i>
<figcaption class="horiz-menu-item figure-caption text-center">External</figcaption>   
</figure>	  
</a>

  <ul class="dropdown-menu" aria-labelledby="MenuEnglish">

     
	  	          <li>
         <div class="dropdown-item ">Tipitaka:
  <a class="text-reset" target="_blank"  href="https://84000.org/" title="Thai Tipitaka at 84000.org">Thai</a>
  <a class="text-reset" target="_blank"  href="https://tipitaka.org/" title="VRI Tipitaka at Tipitaka.org">VRI</a>  
  <a class="text-reset" target="_blank"  href="https://gretil.sub.uni-goettingen.de/gretil.html#Suttapit" title="PTS Tipitaka at GRETIL">PTS</a>  
  <a class="text-reset" target="_blank"  href="https://suttacentral.net/pitaka/sutta?lang=en" title="Mahāsaṅgīti Edition at SuttaCentral.net">MS</a>
       </div>
         </li>
		 
 
<li>
  <div class="dropdown-item">Tipitaka CST:
    <a class="text-reset" target="_blank"  href="https://apply.paauksociety.org/tipitaka/index.php" title="Paauksociety.org">PA</a>
    <a class="text-reset" target="_blank"  href="https://tipitaka.app" title="Tipitaka.app">Tp.app</a>
    <a class="text-reset" target="_blank"  href="https://tipitakapali.org/" title="Tipitaka Pali Online">TPO</a>
    <a class="text-reset" target="_blank"  href="https://americanmonk.org/tipitaka-pali-reader/" title="Tipitaka Pali Reader App">TPR</a>
  </div>
</li>
	

                  
        <li><a class="dropdown-item" target="_blank" href="https://www.digitalpalireader.online/_dprhtml/index.html">Digital Pali Reader</a></li>


               
        <li><a class="dropdown-item" target="_blank" href="https://simsapa.github.io/">Simsapa Pali Reader <u>PC</u> <u>Mac</u> <u>Linux</u></a></li>
  
                <li>
         <div class="dropdown-item ">
		   <a class="text-reset" target="_blank"  href="https://suttacentral.net/pitaka/sutta?lang=en" title="Mahāsaṅgīti Edition at SuttaCentral.net">SuttaCentral</a>

                <a class="text-reset" target="_blank"  href="https://suttacentral.net/pitaka/vinaya?lang=en">Виная</a>
         <a class="text-reset" target="_blank"  href="https://www.sc-voice.net/">Voice</a>
        <a class="text-reset" target="_blank"  href="' . $linksclegacy . '">Legacy</a>
         </div>
         </li>
    
                  
 <li><a class="dropdown-item" target="_blank" href="' . $linktbwOnMain . '">
   <i class="' . $iconimportant . '"></i>
 The Buddha\'s Words</a></li> 
 
 

          <li><a class="dropdown-item" target="_blank" href="' . $linkmolds . '">' . $anamemolds . '</a></li>   
<!-- <li><a class="dropdown-item" href="https://github.com/digitalpalidictionary/digitalpalidictionary/releases">' . $anamedpd . '</a></li>  -->

 <li>

         <div class="dropdown-item ">Patimokkha 

         <a class="text-reset" target="_blank"   href="' . $linkati . '">ATI</a>
       <a class="text-reset" target="_blank"  href="/assets/dhammatalks.org/vinaya/bmc/Section0000.html">BMC</a>
          <a class="text-reset" target=""  href="/assets/materials/bupm_trn_by_nanatusita.pdf">Nanatusita</a>  
       </div>
         </li>
            
  <li><a class="dropdown-item" target="" href="/assets/materials/bipm_trn_by_chatsumarn_kabilsingh.pdf">Patimokkha Bi trans. by Ch Kabilsingh</a></li>
        

         <li>
         <div class="dropdown-item ">    
  <a class="text-reset" href="/san/d/mg.php" >Prātimokṣa</a>
    <a class="text-reset" href="/san/sarv.php" >sarv</a>
    <a class="text-reset" href="/san/mg.php" >mg</a>
    <a class="text-reset" href="/san/lo.php" >lo</a>
    <a class="text-reset" href="/san/mu2.php" >mu2</a>
    <a class="text-reset" href="/san/mu3.php" >mu3</a>
         </div>
         </li>

          <li><a class="dropdown-item" target="_blank" href="' . $linknoblasc . '">' . $anameasc . '</a></li>

        
  </ul>

<a title="Common Search History" class="dropup text-decoration-none mx-1 d-md-inline-block" id="history" href="/history.php">
<figure class="figure">
  <i class="menu-icon fa-solid fa-clock-rotate-left"></i>
<figcaption class="horiz-menu-item figure-caption text-center">' . $anamehist . '</figcaption>   
</figure>	  
</a>



<!--
<a class="dropdown text-decoration-none mx-1 d-md-inline-block" id="CSEMenu" data-bs-toggle="dropdown" aria-expanded="false" href="#">
<figure class="figure d-md-inline-block">
  <i class="menu-icon fa-brands fa-google"></i>
<figcaption class="horiz-menu-item figure-caption text-center">CSE</figcaption>   
</figure>	  
</a>
  <ul class="dropdown-menu" aria-labelledby="CSEMenu">
   <li>
      <script async src="https://cse.google.com/cse.js?cx=c184c71e0fe5d4c93"></script>
<div class="gcse-searchbox-only" data-newWindow="true" data-resultsUrl="/cse.php"></div>   
     </li>
</ul>

 <a class="text-decoration-none mx-1" href="/cse.php">
<figure class="figure">
<i class="menu-icon fa-brands fa-google"></i>
<figcaption class="horiz-menu-item figure-caption text-center">CSE</figcaption>   
</figure>	  
</a> 
    -->

<a title="AI-assistants, Dictionaries Pali and Sanskrit. Links will use current word from search bar. \'Magic button\'(Alt + Q)" class="dropdown text-decoration-none mx-1 d-md-inline-block" id="MenuDict" data-bs-toggle="dropdown" aria-expanded="false" href="#">
  <figure class="figure d-md-inline-block">
    <i class="menu-icon fa-solid fa-book-atlas"></i>
    <figcaption class="horiz-menu-item figure-caption text-center">AI & Dicts</figcaption>   
  </figure>	  
</a>

<ul class="dropdown-menu" aria-labelledby="MenuDict">


               <li>
         <div class="dropdown-item ">
<i class="' . $iconimportant . '"></i> <a class="text-reset" target="" href="javascript:void(0)" onclick="openWithQuery(event, \'https://dict.dhamma.gift/search_html?source=pwa&q={{q}}\')">Digital Pāḷi Dict</a>
         <a class="text-reset" target="_blank"   href="https://digitalpalidictionary.github.io/">Offline</a>
       <a class="text-reset" target=""  href="#links">Extentions</a>     
       </div>
         </li>   
   
   <li>
  <a class="dropdown-item" title="Open word in PTS/Cone/DPD/CPD/Skr+/Wisdomlib (Alt + Q)" href="#" onclick="openDictionaries(event)"><i class="' . $iconimportant . '"></i> Open PTS/Cone/DPD/CPD/Skr+/Wisdoml</a>
<script src="/assets/js/openDicts.js"></script>
</li>  
   <li>
<a class="dropdown-item" title="PTS Pali Dictionary + Critical Pali Dictionary + Gandhari Dictionary" href="javascript:void(0)" onclick="return openWithQueryMulti(event, [
  \'https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?matchtype=default&qs=\',
  \'https://gandhari.org/dictionary?section=dop&search=\'
  \'https://cpd.uni-koeln.de/search?query=\',
])">Pali PTS, Cone, CPD</a>
</li>  

<li>
  <a class="dropdown-item" target="_blank" href="javascript:void(0)"
     onclick="return openWithQuery(event, \'https://cpd.uni-koeln.de/search?query={{q}}\')">
    Critical Pali Dict (CPD)
  </a>
</li> 
<li><a class="dropdown-item" href="javascript:void(0)" target="_blank" onclick="openWithQuery(event, \'https://gandhari.org/dictionary?section=dop&search={{q}}\')">M. Cone dictionary Gandhari.org</a></li>
   <li><a class="dropdown-item" target="_blank" href="javascript:void(0)" onclick="openWithQuery(event, \'https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?matchtype=default&qs={{q}}\')">R. Davids, W. Stede dictionary PTS</a></li>


      <li>
         <div class="dropdown-item "> Skr
<a class="text-reset" target="_blank" title="Monier-Williams Sanskrit-English Dictionary, 1899" href="javascript:void(0)" onclick="openWithQuery(event, \'https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc/indexcaller.php?transLit=roman&key={{q}}\');">MW</a>
<a class="text-reset" title="Monier-Williams + Shabda-Sagara + Apte Practical + Macdonell" href="javascript:void(0)" onclick="return openWithQueryMulti(event, [
  \'https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc/indexcaller.php?transLit=roman&key=\',
  \'https://www.sanskrit-lexicon.uni-koeln.de/scans/SHSScan/2020/web/webtc/indexcaller.php?transLit=roman&key=\',
  \'https://www.sanskrit-lexicon.uni-koeln.de/scans/APScan/2020/web/webtc/indexcaller.php?transLit=roman&key=\',
  \'https://www.sanskrit-lexicon.uni-koeln.de/scans/MDScan/2020/web/webtc/indexcaller.php?transLit=roman&key=\'
])">+</a>


 <a class="text-reset" target="_blank" title="All available Skr dicts at Cologne University Site"  href="https://www.sanskrit-lexicon.uni-koeln.de/">Many dicts</a>
    <a class="text-reset" target="_blank" href="javascript:void(0)" onclick="openWithQuery(event, \'https://sanskritdictionary.com/?iencoding=iast&q={{q}}&lang=sans&action=Search\')">Skrdict</a>
<a class="text-reset" target="_blank" href="javascript:void(0)" onclick="openWithQuery(event, \'https://www.learnsanskrit.cc/translate?dir=au&search={{q}}\')">Learnskr</a>
       </div>
         </li>
      <li>
         <div class="dropdown-item "> Pali-Skr
        <a class="text-reset" href="javascript:void(0)" target="_blank" onclick="openWithQuery(event, \'https://glosbe.com/pi/sa/{{q}}\')">Glosbe</a>
        <a class="text-reset" target="_blank"   href="https://sambhasha.ksu.ac.in/CompLing/pcl_1/html/Application%20home.html">Sambhasha</a>
        <a class="text-reset" target="_blank" href="https://rephrasely.com/translate/translate-pali-to-sanskrit">Pl to SA AI</a>
       </div>
         </li>

               <li>
         <div class="dropdown-item ">
         <i class="' . $iconimportant . '"></i>
         <a class="text-reset" target="_blank" href="https://chatgpt.com">ChatGPT</a>
    <a class="text-reset" target="_blank" href="https://gemini.google/">Gemini</a>
         <a class="text-reset" target="_blank" href="https://chat.deepseek.com">DeepSeek</a>
      <a class="text-reset" target="_blank" href="https://norbu-ai.org/">Norbu AI</a>
           </div>
         </li>

         <li>
         <div class="dropdown-item ">
         <a class="text-reset" target="_blank" href="https://dictionary.sutta.org/">Sutta.org</a>
         <a class="text-reset" target="_blank" href="  https://buddhistuniversity.net/content/reference/pali-thai-english-sanskrit-dictionary
">Buddhist University</a>
        <a class="text-reset"  target="_blank" href="http://dictionary.tamilcube.com/pali-dictionary.aspx">Eng-Pali</a>
           </div>
         </li>
<li><a class="dropdown-item" target="_blank" href="javascript:void(0)" onclick="openWithQuery(event, \'https://dharmamitra.org/?target_lang=english-explained&input_sentence={{q}}\')">Mitra Translator</a></li>

<li>
  <a class="dropdown-item" href="javascript:void(0)" onclick="openWithQuery(event, \'https://www.wisdomlib.org/index.php?type=search&division=glossary&item=&mode=text&input={{q}}\')" target="_blank">
    Wisdomlib.org
  </a>
</li>
		 

</ul>


<a title="Materials and sites" class="dropdown text-decoration-none mx-1 d-md-inline-block" id="materials" data-bs-toggle="dropdown" aria-expanded="false" href="#">
<figure class="figure d-md-inline-block">
  <i class="menu-icon fa-solid fa-graduation-cap"></i>
<figcaption class="horiz-menu-item figure-caption text-center">' . $anamematerials . '</figcaption>   
</figure>	  
</a>
  <ul class="dropdown-menu" aria-labelledby="materials">
   <li><a class="dropdown-item" href="' . $linkcases . '">
     <i class="' . $iconimportant . '"></i>
     ' . $anamecases . '</a></li>
       <li><a class="dropdown-item" href="' . $linkconj . '">
         <i class="' . $iconimportant . '"></i>
         ' . $anameconj . '</a></li>
      <li><a class="dropdown-item" href="' . $linktextbook . '">
        <i class="' . $iconimportant . '"></i>
        J.W. Gair – Pali Course</a></li>
   <li><a class="dropdown-item" href="' . $linkwarder . '">
     <i class="' . $iconimportant . '"></i>
    A.K. Warder – Introduction to Pali</a></li>    
 
 
    <li><a class="dropdown-item" href="' . $linkmagadhabhasa . '">
     <i class="' . $iconimportant . '"></i>
    Thauttamo Bh – Pali 3 ed.</a></li>       

                  <li>
         <div class="dropdown-item ">Materials
         <a class="text-reset" target=""   href="' . $linksothermat . '">Gdrive</a>
                   <a class="text-reset" target="_blank"  href="https://www.ancient-buddhist-texts.net/Textual-Studies/index.htm">ABT.net</a>
        <a class="text-reset" target="_blank"  href="https://sasanarakkha.github.io/study-tools/">SBS</a>  
       </div>
         </li>     
   
                   
         <li><a class="dropdown-item" target="_blank" href="' . $linklearnpali . '">' . $anamemlearnpali . '</a></li>  
         
<li>

<div class="dropdown-item ">
<a target="_blank" class="text-reset" href="https://www.thebuddhistsociety.org/page/sanskrit-and-pali-study-resources-guide-by-james-whelan">' . $anamelearnsanskrit . '</a> <a class="text-reset" target="_blank" href="https://drive.google.com/drive/folders/1jAy_xD6qkrnIkmXO9e4KtI_--nDMySSn">gd</a> <a class="text-reset" target="_blank" href="https://www.youtube.com/@jameswhelan2381">yt</a>

       </div>


</li>  




                      <li>
<div class="dropdown-item ">
         <i class="' . $iconimportant . '"></i><a class="text-reset" href="/assets/memo.html"> Memorizer</a>
         <a class="text-reset" target=""   href="/memorize/?q=sn56.11">sn56.11</a> 
         <a class="text-reset" target=""   href="/memorize/?q=dn22">dn22</a> 
         <a class="text-reset" target=""   href="/memorize/?q=sn12.2">sn12.2</a>
       </div>
         </li>     

<li><a class="dropdown-item" target="" href="https://docs.google.com/document/d/1JWHEFqcaNhYwYneWBnTp9rkgWecDB4IIHX1l3AxSiWM/edit?usp=drivesdk">Memorisation Tips & Tricks</a></li> 
                  <li>
         <div class="dropdown-item ">Trainer for
         <a class="text-reset" target=""   href="/ru/assets/grammar/nouns.html">Declentions</a>, for              
                   <a class="text-reset" target=""  href="/assets/rr.html">Patimokkha</a>
       </div>
         </li>     
    
       
  <!--     <li><a class="dropdown-item" href="#research">' . $anameresearch . '</a></li>
       <li><a class="dropdown-item" href="#read">' . $anameread . '</a></li>
    <li><a class="dropdown-item" href="#study">' . $anamestudy . '</a></li> -->
</ul>

<div class="d-inline-flex align-items-center gap-1">

<a title="Converters and other useful tools" class="dropdown text-decoration-none mx-1 d-md-inline-block" id="tools" data-bs-toggle="dropdown" aria-expanded="false" href="#">

<figure class="figure d-md-inline-block">

<i class="menu-icon fa-solid fa-screwdriver-wrench"></i>
<figcaption class="horiz-menu-item figure-caption text-center">' . $anametools . '</figcaption>   
</figure>	  
</a>
  <ul class="dropdown-menu" aria-labelledby="tools">
   
         <li>
         <div class="dropdown-item ">
          <a class="text-reset" target=""  onclick="localStorage.setItem(\'siteLanguage\', \'th\');" href="/th/?q=">DG</a> 
          <a class="text-reset" target=""   href="/old.php">old</a>
        <a class="text-reset" target=""   href="/tts.php">TTS</a>  
       <!--  <a class="text-reset" target=""  href="/new/">new</a> --> 
                  <a class="text-reset" target=""  href="' . $readerPage . '">index</a>  
<a class="text-reset" target=""  href="/assets/texts/sutta.php">sutta</a>                       
      <a class="text-reset" target=""  href="/pm.php?expand=true">bupm</a>        
      <a class="text-reset" target=""  href="/bipm.php?expand=true">bipm</a> 

         </div>
         </li>
         
   
   <li><a class="dropdown-item" target="" href="/assets/common/lunar.html"> <i class="' . $iconimportant . '"></i> Sutta based Uposattha days</a></li>
     
    <li>
  <a class="dropdown-item" href="javascript:void(0)" target="_blank" onclick="openWithQuery(event)">
    <i class="' . $iconimportant . '"></i> Aksharamukha script converter
  </a>
</li>


   <li><a class="dropdown-item" target="_blank" href="/cse.php">Google Custom Search</a></li>
   
              <li>
         <div class="dropdown-item ">PTS Converter
         <a class="text-reset" target="_blank"   href="https://palistudies.blogspot.com/2020/02/sutta-number-to-pts-reference-converter.html">#1</a>
                   <a class="text-reset" target="_blank"  href="https://benmneb.github.io/pts-converter/">#2</a>  
       </div>
         </li>   

     <li>
         <div class="dropdown-item "> 
         <a class="text-reset" target="_blank"   href="https://readingfaithfully.org/">ReadingFaithfully.org</a>
                   <a class="text-reset" target="_blank"  href="/assets/br/">blurbs</a>  
       <a class="text-reset" target="_blank"  href="https://index.readingfaithfully.org/">index</a>
       </div>
    </li>  
         
   <li><a class="dropdown-item" href="/assets/linebyline.html">Line-by-line Translation Tool</a></li>   
<li><a class="dropdown-item" href="/assets/diff/?lang=pl">' . $anamesdiff . '</a></li>
      

<li><a class="dropdown-item" href="/assets/makelist.html">
  <i class="' . $iconimportant . '"></i>
' . $head5makelist . '</a></li>  
</ul>

  <a title="Dhamma.Gift Multi-Tool Help"
     href="/assets/common/multiTool.html"
     class="text-muted text-decoration-none"
     style="font-size: 0.75rem; line-height: 1; position: relative; top: 0.4em;">
    *
  </a>
</div>


</div> 
'
?>