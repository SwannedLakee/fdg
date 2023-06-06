<?php
date_default_timezone_set('Asia/Almaty');

$started = new DateTime('2021-11-12');
$sevenyears = new DateTime('2028-11-12');
$today = new DateTime(date('Y-m-d'));

$passed = $started->diff($today);
$left = $today->diff($sevenyears);
$total = $started->diff($sevenyears);

$passedformat = $passed->format('%a');
$leftformat = $left->format('%a');
$totalformat = $total->format('%a');

$passedinmonth = round(($passedformat / 12),1); 
$leftinmonth = round(($leftformat / 12),1); 
$totalinmonth = round($totalformat / 12); 

$passedinyears = round(($passedformat / 365),1); 
$leftinyears = round(($leftformat / 365),1); 
$totalinyears = round($totalformat / 365); 

$started = $started->format('Y-m-d');
$sevenyears = $sevenyears->format('Y-m-d');
$today = $today->format('Y-m-d');
/*
echo "started on " . $started . "<br>
seven years " . $sevenyears . "<br>
today is " . $today . "<br>
<br>
$passedformat days passed<br>
$leftformat days left<br>
$totalformat days total<br>
<br>
$passedinmonth months passed<br>
$leftinmonth months left<br>
$totalinmonth months total<br>
<br>
$passedinyears years passed<br>
$leftinyears years left<br>
$totalinyears years total
<br>"; */

?>

<!DOCTYPE html>
<html>
<head>
<title>Countdown</title>
<link rel="icon" type="image/png" href="https://find.dhamma.gift/assets/img/favico-noglass.png" />
 <meta http-equiv="Cache-control" content="public">
<meta property="og:type" content="article" />
<meta property="og:title" content="Countdown - find.Dhamma.gift" />
<meta property="og:description" content="Countdown - find.Dhamma.gift" />
<meta name="description" content="Countdown - find.Dhamma.gift">
<meta name="twitter:title" content="Countdown - find.Dhamma.gift">
<meta name="twitter:description" content="Countdown - find.Dhamma.gift">
<meta property="og:image" itemprop="image" content="" />

<meta name="viewport" content="width=device-width, initial-scale=1">
<meta charset="UTF-8">

<link rel="stylesheet" type="text/css" href="/assets/css/datatables.min.css"/>
<link rel="stylesheet" href="/assets/css/langswitch.css">
<script type="text/javascript" src="/assets/js/datatables.min.js"></script>
<script type="text/javascript" src="/assets/js/natural.js"></script>
<script type="text/javascript" src="/assets/js/strip-html.js"></script>
<!-- <script type="text/javascript" src="/assets/js/diacritics.js"></script> -->



<link href="/assets/css/dataTables.bootstrap5.min.css" rel="stylesheet" type="text/css" />
<link href="/assets/css/bootstrap.min.5.2.css" rel="stylesheet" type="text/css" />
<link href="/assets/css/extrastyles.css" rel="stylesheet" />
<link href="/assets/css/table.css" rel="stylesheet" />
<!--<script src="https://cdn.jsdelivr.net/gh/virtualvinodh/aksharamukha/aksharamukha-web-plugin/aksharamukha-v3.js?class=verse"></script>-->
</head>
<body>
<div class="container-fluid mt-2">    
    <h3 class="pl-2 ml-2">Countdown</h3>
            <button class="btn btn-light" type="button">
           <a href="/ru">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="body_1" width="20" height="15">
                <g transform="matrix(0.13384491 0 0 0.13384491 1.7765683 -0)">
                    <g>
                        <path
                            d="M61.44 0L0 60.18L14.99 68.05L61.04 19.7L107.89 68.06L122.88 60.19L61.44 0zM18.26 69.63L61.5 26.38L104.61 69.63L104.61 112.06L73.12 112.06L73.12 82.09L49.49 82.09L49.49 112.06L18.26 112.06L18.26 69.63z"
                            stroke="none" fill="#989898" fill-rule="nonzero" />
                    </g>
                </g>
            </svg>
                       </a>
      </button>    
    <button id="btn-hide-all-children" class="btn btn-light" type="button">Saṁvaṭṭo</button>
<button id="btn-show-all-children" class="btn btn-light" type="button">Vivaṭṭo</button>


<!--
<button class="btn btn-light forshellscript" type="button"><a class="link-dark text-decoration-none " href="./adhivacanasamphasso_suttanta_pali_words_1-2-1.html">Words</a></button>    



<button id="language-button" class="hide-button btn btn-light" type="button">Pāḷi / Eng</button>
-->
<hr>
<table id="pali" class="display table table table-striped table-hover table-responsive " cellspacing="0" width="100%">
   <thead class="thead-light">
        <tr>
            <th>#</th>
            <th>Milestone</th>
            <th>Date</th>
            <th>Type</th>            
            <th>Days</th>
            <th>Months</th>
            <th>Years</th>
            <th class="none">Links</th>
        </tr>
    </thead>
    <tbody id="sutta"><tr>
      <td>
  1
</td>
<td>
  Started
</td>
<td>
    <?php echo $started ?>
</td>
<td>
  Passed
</td>
<td>
  <?php echo $passedformat ?>
</td>
<td>
    <?php echo $passedinmonth ?>
</td>   
<td>
    <?php echo $passedinyears ?>
</td>
<td>
<a target="_blank" href=/ru/sc/?q=sn51.20>sn51.20</a> 
<a target=_blank href=/ru/sc/?q=dn22>dn22</a> 
<a target=_blank href=/ru/sc/?q=mn77>mn77</a> 
 
</td>
</tr>

<tr>
      <td>
  2
</td>
<td>
  7 Years 
</td>
<td>
    <?php echo $sevenyears ?>
</td>
<td>
  Left
</td>
<td>
  <?php echo $leftformat ?>
</td>
<td>
    <?php echo $leftinmonth ?>
</td>   
<td>
    <?php echo $leftinyears ?>
</td>
<td>
<a target="_blank" href=/ru/sc/?q=bu-pm>bu-pm</a> 
<a target=_blank href=/ru/sc/?q=sn56.11>sn56.11</a> 
<a target=_blank href=/ru/sc/?q=dn15>dn15</a> 
 
</td>
</tr>

<tr>
      <td>
  3
</td>
<td>
  Today
</td>
<td>
    <?php echo $today ?>
</td>
<td>
  Total
</td>
<td>
  <?php echo $totalformat ?>
</td>
<td>
    <?php echo $totalinmonth ?>
</td>   
<td>
    <?php echo $totalinyears ?>
</td>
<td>
<a target="_blank" href=/ru/sc/?q=sn22.95>sn22.95</a>  
<a target=_blank href=/ru/sc/?q=sn22.102>sn22.102</a>  
<a target=_blank href=/ru/sc/?q=sn35.70>sn35.70</a>  
<a target=_blank href=/ru/sc/?q=an3.101>an3.101</a>  
<a target=_blank href=/assets/audio/dn_Syrkin.pdf>ДН пер. Сыркин А.Я.</a>  
<a target=_blank href=http://titus.uni-frankfurt.de/texte/etcs/ind/aind/bskt/lankavat/lanka.htm>TITUS</a>  
<a target=_blank href=http://spiritual.su/>spiritual.su</a> 
<a target=_blank href=http://probud.narod.ru/dop.html>Probud.narod.ru</a> 
 
</td>
</tr>

</tbody>
</table>
<br><br><hr>
<a href='/' id='back'>Main</a>&nbsp;
<a href='/ru/sc'>Read</a>&nbsp;
<a href='/assets/diff'>SuttaDiff</a>&nbsp;
<a href='/history.php'>History</a>&nbsp;
<!--
<a href="/result/adhivacanasamphasso_suttanta_pali_words_1-2-1.html">Words</a>
-->
</div>
<script type="text/javascript" src="/assets/js/typeahead/bootstrap3-typeahead.min.js"></script>
    <script type='text/javascript'>
   $(document).ready(function() {
   var dataSrc = [];
	 var table = $('#pali').DataTable({
	   'autoWidth': true,
	   'stateSave': true,
	   'paging'  : true,
	    'colReorder': true,
	    "orderMulti": true,
	   'pageLength' : 28,
	   'lengthMenu' : [10, 28, 50, 100, 1000],
	  'responsive': true,
	  'columnDefs': [
	            { type: "html", target: [1,2,6] },
	            { type: 'natural', targets: 0 }
					],
					
			
      'initComplete': function(){
         var api = this.api();

         // Populate a dataset for autocomplete functionality
         api.cells('tr', [0, 1, 2, 3, 4, 5, 6, 7]).every(function(){
            //var data = this.data().replace( /(<([^>]+)>)/ig, '');
            var data = $('<div>').html(this.data()).text();
          //  console.log(data);
            if(dataSrc.indexOf(data) === -1){ dataSrc.push(data); }
         });

         // Initialize Typeahead plug-in
         $('.dataTables_filter input[type="search"]', api.table().container())
            .typeahead({
              autoSelect: false,
               source: dataSrc,
               afterSelect: function(value){
                  api.search(value).draw();
               }
            }
         );
      }
   });			

    // Handle click on "Expand All" button
    $('#btn-show-all-children').on('click', function(){
        // Expand row details
        table.rows(':not(.parent)').nodes().to$().find('td:first-child').trigger('click');
    });
    // Handle click on "Collapse All" button
    $('#btn-hide-all-children').on('click', function(){
        // Collapse row details
        table.rows('.parent').nodes().to$().find('td:first-child').trigger('click');
    });
});
  </script>

    <script type="module" src="/assets/js/langswitch.js"></script>      
</body>
</html>