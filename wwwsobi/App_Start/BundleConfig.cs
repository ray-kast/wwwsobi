using rkWeb.Bundling;
using System.Web;
using System.Web.Optimization;

namespace wwwsobi {
  public partial class MvcApplication {
    void OnRegisterBundles(BundleDictionary bundles) {
      //Bundle all the font definition files. (All Res/Fonts/.../Fonts.scss files)
      this.BundleFonts(bundles);

      //Bundle the default scripts (namely Modernizr and rkLib).
      this.BundleDefaultScripts(bundles);

      //Bundle the styles for the default layout.
      bundles.Style("~/Styles/Layouts/Default")
        .File("~/Res/Styles/Layouts/Default.scss");

      //Bundle the scripts for the default layout.
      bundles.Script("~/Scripts/Layouts/Default")
        .File("~/Res/Script/Layouts/Default.scss");
      
      //Uncomment this to force combining and minifying files:
      //bundles.Optimize();
    }
  }
}
