import debug_toolbar
from django.conf import settings
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("network.urls")),
    path('__debug__/', include(debug_toolbar.urls)),
]
