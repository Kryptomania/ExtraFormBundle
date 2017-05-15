KryptoMania Extra Form Bundle
=============================

This bundle provides  the possibility to enhance some Symfony native form
controls like  `CollectionType` or `ChoiceType`.

 

Installation
------------

### Step1: Install with composer

Run the following composer require command:

``` bash
$ composer require kryptomania/extra-form-bundle

```

 
### Step 2: Enable the bundle

Finally, enable the bundle in the kernel:

``` php
<?php
// app/AppKernel.php

public function registerBundles()
{
    $bundles = array(
        // ...
        new Kryptomania\ExtraFormBundle\KryptomaniaExtraFormBundle(),
    );
}
```


### Step 3: Add form theme

In config.yml:

``` yaml
# app/config/config.yml

twig:
    form_themes:
        - 'KryptomaniaExtraFormBundle:Form:fields.html.twig'
```



### Step 4: Include javacript files

You will have to include the bundled javacript in your base template file for global use. You can also include it only in the views where you want to use it.


``` html
<!--  app/Resources/views/base.html.twig -->

    <!-- ExtraForm: CollectionType jQuery plugin -->
    <script src="{{ asset('bundles/kryptomaniaextraform/js/jquery.km.sfembedforms.js') }}"></script>
```

Important : This is a jQuery plugin, make sure to inclue jQuery file before.
 

Usage
-----

For basic usage, in your view:


``` twig
    {#  ...  #}
    
    {{ form_row(form.myCollection) }}
    
    {#  ...  #}


    <script language="javacript">
        $(document).ready(function(){
            $("#{{ form.myCollection.vars.id}}").sfEmbedForms();
        });
    </script>
```





