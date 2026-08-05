const sidebar=document.getElementById('sidebar');
const menuButton=document.getElementById('menuButton');
const backdrop=document.getElementById('sidebarBackdrop');
const closeSidebar=()=>{sidebar.classList.remove('open');backdrop.classList.remove('open')};
menuButton?.addEventListener('click',()=>{sidebar.classList.toggle('open');backdrop.classList.toggle('open')});
backdrop?.addEventListener('click',closeSidebar);
document.querySelectorAll('.sidebar a').forEach(link=>link.addEventListener('click',()=>{if(window.innerWidth<=820)closeSidebar()}));
