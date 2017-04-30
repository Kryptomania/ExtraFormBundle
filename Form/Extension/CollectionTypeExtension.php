<?php

namespace Kryptomania\ExtraFormBundle\Form\Extension;

use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Form\FormView;
use Symfony\Component\Form\FormInterface;

class CollectionTypeExtension extends AbstractTypeExtension
{
    /**
     * Returns the name of the type being extended.
     *
     * @return string The name of the type being extended
     */
    public function getExtendedType()
    {
        return CollectionType::class;
    }


    /**
     * Configure Options
     *
     * @param FormView $view
     * @param FormInterface $form
     * @param array $options
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
			'column_header_label'      => true,
			'single_field_label'       => false,
			'single_field_label_xs'    => true,
			'entry_css_class'          => 'row',
			'entry_actions_css_class'  => 'form-group text-right col-xs-12',
			'column_css_class'         => array(),
		));

		// Optional
		/*$resolver->setDefined(array(
			'column_css_class',
		));*/
		
		
		$resolver->setAllowedTypes('column_header_label', 'bool');
		$resolver->setAllowedTypes('single_field_label', 'bool');
		$resolver->setAllowedTypes('single_field_label_xs', 'bool');
		$resolver->setAllowedTypes('entry_css_class', 'string');
		$resolver->setAllowedTypes('entry_actions_css_class', 'string');
		$resolver->setAllowedTypes('column_css_class', 'array');
    }




    /**
     * Pass columns and columns title to the view
     *
     * @param FormView $view
     * @param FormInterface $form
     * @param array $options
     */
    public function buildView(FormView $view, FormInterface $form, array $options)
    {
		$attr = $options['attr'];

		
		// Columns css class 
		$columnCssClass = $options['column_css_class'];
		if (isset($attr['classes']) && is_array($attr['classes']) )
		{
			@trigger_error('Using CollectionType with key \'classes\' in property \'attr\' is deprecated and will be removed in 2.0 Use \'column_css_class\' attribute instead.', E_USER_DEPRECATED);
			$columnCssClass = $attr['classes'];
			unset($options['attr']['classes']);
		}

		$view->vars['columnCssClass'] = $columnCssClass;


		// Colums css class 
		$entryActionsCssClass = $options['entry_actions_css_class'];
		if (isset($attr['delete_class']))
		{
			@trigger_error('Using CollectionType with key \'delete_class\' in property \'attr\' is deprecated and will be removed in 2.0 Use \'entry_actions_css_class\' attribute instead.', E_USER_DEPRECATED);
			$entryActionsCssClass = $attr['delete_class'];
		}
		$view->vars['entryActionsCssClass'] = $entryActionsCssClass;


		// Other values
		$view->vars['columnHeaderLabel']   = $options['column_header_label'];
		$view->vars['singleFieldLabel']    = $options['single_field_label'];
		$view->vars['singleFieldLabelXs']  = $options['single_field_label_xs'];
		$view->vars['entryCssClass']       = $options['entry_css_class'];
    }

}