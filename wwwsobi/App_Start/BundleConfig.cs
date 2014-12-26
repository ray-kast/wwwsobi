using rkWeb.Bundling;
using System.Web;
using System.Web.Optimization;

namespace wwwsobi {
  public partial class MvcApplication {
    void OnRegisterBundles(BundleDictionary bundles) {
      this.BundleFonts(bundles);
      this.BundleDefaultScripts(bundles);

      bundles.Style("~/Styles/Layouts/Default")
        .File("~/Res/Styles/Layouts/Default.scss");

      bundles.Script("~/Scripts/Layouts/Default")
        .File("~/Res/Script/Layouts/Default.scss");
    }
  }
}
