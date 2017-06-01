var markup = null;
$(function() {
   markup = Markup('#pdf-markup');

   $('.button-bar > ul').find('a').each(function() {
        var pluginName = $(this).data('plugin');
        var plugin = window[pluginName];

        markup.AddPlugin(plugin);
        $(this).on('click', function(){ window[$(this).data('plugin')].New(markup); });
   });
});