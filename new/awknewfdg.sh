#keyword="$(echo $@ | awk '{$1=""; print $0}' | sed 's/^ //')" &nbsp;
keyword="$2"
awk -F "@" 'BEGIN { ORS = "" }  { OFS = "" } 
{
texttype=$1
file_name=$2
textclass=$3
gsub(/[ \t]+$/, "", $5)
quote=$5
line_id=$4

if (match(file_name, /[0-9]-[0-9]/)) {
anchorpart = $4
} else { 
  anchorpart = $4
    gsub(".*:", "", anchorpart)
}
 textAndAnchor = file_name "#" anchorpart
 urlwithanchor = textAndAnchor
sutta=$4
 gsub(":.*", "", sutta)
 
    if ( name == "" ) { 
name=sutta
} 
 unhiddenlink="<a target=_blank class=\"fdgLink quoteLink-start text-reset text-decoration-none\" href=\"\" data-slug=\"" urlwithanchor "\"></a>"
 hiddenlink="<a target=_blank class=\"fdgLink quoteLink text-white text-decoration-none\" href=\"\" data-slug=\"" urlwithanchor "\"></a>" 
 if ( textclass == 1 ) {
   language="pi"
   htmlclass="pli-lang"
   } 
else if ( textclass == 2 ) {
   language="ru" 
   htmlclass="eng-lang text-muted font-weight-light"
 } 
else if ( textclass == 4 ) {
   language="pi" 
   htmlclass="pli-lang text-muted font-weight-light"
} else {
   language="en" 
   htmlclass="eng-lang text-muted font-weight-light"
 }

        if (prev_file != file_name && NR != 1) {
        print "</p></td></tr>"
        print "\n"
    } 
if (NR == 1 || (file_name != prev_file && textclass == 1)) {
    
        print texttype "@" urlwithanchor "@" file_name "@" sutta "@<td><p><span class=\"" htmlclass " quote\" lang=\"" language "\">" unhiddenlink " " quote, hiddenlink "</span>;;;<br class=\"styled\">;;;"
    } else {
        print "<span class=\"" htmlclass " quote\" lang=\"" language "\">"  unhiddenlink " " quote, hiddenlink  "</span><br class=\"styled\">;;;"
    }

    prev_file = $2
    prev_line = NR}
END  { 
        print "</p></td></tr>"
        print "\n"
    }' "$1" 


exit 0
if (prev_file != file_name && NR != 1) {
        print "</p></td></tr>"
    }  else  

 print count, metaphor, text_name, prev_file, file_name