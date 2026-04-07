import React from 'react';
import { FormError } from 'components/common/Input/Input.styled';
import { ErrorMessage } from '@hookform/error-message';
import {
  useForm,
  Controller,
  useFieldArray,
  FormProvider,
} from 'react-hook-form';
import { Button } from 'components/common/Button/Button';
import IconButtonWrapper from 'components/common/Icons/IconButtonWrapper';
import CloseCircleIcon from 'components/common/Icons/CloseCircleIcon';
import { yupResolver } from '@hookform/resolvers/yup';
import yup from 'lib/yupExtended';
import PlusIcon from 'components/common/Icons/PlusIcon';
import ReactAce from 'react-ace';
import Input from 'components/common/Input/Input';
import { useTranslation } from 'components/contexts/LocaleContext';

import * as S from './QueryForm.styled';

interface QueryFormProps {
  fetching: boolean;
  hasResults: boolean;
  resetResults: () => void;
  submitHandler: (values: FormValues) => void;
}
type StreamsPropertiesType = {
  key: string;
  value: string;
};
export type FormValues = {
  ksql: string;
  streamsProperties: StreamsPropertiesType[];
};

const streamsPropertiesSchema = yup.object().shape({
  key: yup.string().trim(),
  value: yup.string().trim(),
});
const validationSchema = yup.object({
  ksql: yup.string().trim().required(),
  streamsProperties: yup.array().of(streamsPropertiesSchema),
});

const QueryForm: React.FC<QueryFormProps> = ({
  fetching,
  hasResults,
  submitHandler,
  resetResults,
}) => {
  const { t } = useTranslation();
  const methods = useForm<FormValues>({
    mode: 'onTouched',
    resolver: yupResolver(validationSchema),
    defaultValues: {
      ksql: '',
      streamsProperties: [{ key: '', value: '' }],
    },
  });

  const {
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isDirty },
  } = methods;

  const { fields, append, remove, update } = useFieldArray<
    FormValues,
    'streamsProperties'
  >({
    control,
    name: 'streamsProperties',
  });

  const watchStreamProps = watch('streamsProperties');

  const appendProperty = () => {
    append({ key: '', value: '' });
  };
  const removeProperty = (index: number) => () => {
    if (fields.length === 1) {
      update(index, { key: '', value: '' });
      return;
    }

    remove(index);
  };

  const isAppendDisabled =
    fetching || !!watchStreamProps.find((field) => !field.key);

  const inputRef = React.useRef<ReactAce>(null);

  const handleFocus = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textInput = inputRef?.current?.editor?.textInput as any;

    if (textInput) {
      textInput.focus();
    }
  };

  const handleClear = () => {
    handleFocus();
    resetResults();
  };

  return (
    <FormProvider {...methods}>
      <S.QueryWrapper>
        <form onSubmit={handleSubmit(submitHandler)}>
          <S.KSQLInputsWrapper>
            <S.Fieldset>
              <S.KSQLInputHeader>
                <label id="ksqlLabel">{t('ksqlDb.query.form.ksql')}</label>
                <Button
                  onClick={() => setValue('ksql', '')}
                  buttonType="primary"
                  buttonSize="S"
                  isInverted
                >
                  {t('ksqlDb.query.actions.clear')}
                </Button>
              </S.KSQLInputHeader>
              <Controller
                control={control}
                name="ksql"
                render={({ field }) => (
                  <S.SQLEditor
                    {...field}
                    commands={[
                      {
                        // commands is array of key bindings.
                        // name for the key binding.
                        name: 'commandName',
                        // key combination used for the command.
                        bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
                        // function to execute when keys are pressed.
                        exec: () => {
                          handleSubmit(submitHandler)();
                        },
                      },
                    ]}
                    readOnly={fetching}
                    ref={inputRef}
                  />
                )}
              />
              <FormError>
                <ErrorMessage errors={errors} name="ksql" />
              </FormError>
            </S.Fieldset>

            <S.Fieldset>
              {t('ksqlDb.query.form.streamProperties')}
              {fields.map((field, index) => (
                <S.InputsContainer key={field.id}>
                  <Input
                    name={`streamsProperties.${index}.key`}
                    placeholder={t('ksqlDb.query.form.placeholders.key')}
                    type="text"
                    autoComplete="off"
                    withError
                  />
                  <Input
                    name={`streamsProperties.${index}.value`}
                    placeholder={t('ksqlDb.query.form.placeholders.value')}
                    type="text"
                    autoComplete="off"
                    withError
                  />
                  <IconButtonWrapper
                    aria-label={t('ksqlDb.query.actions.deleteProperty')}
                    onClick={removeProperty(index)}
                  >
                    <CloseCircleIcon aria-hidden />
                  </IconButtonWrapper>
                </S.InputsContainer>
              ))}
              <Button
                type="button"
                buttonSize="M"
                buttonType="secondary"
                disabled={isAppendDisabled}
                onClick={appendProperty}
              >
                <PlusIcon />
                {t('ksqlDb.query.actions.addStreamProperty')}
              </Button>
            </S.Fieldset>
          </S.KSQLInputsWrapper>
          <S.ButtonsContainer>
            <Button
              buttonType="secondary"
              buttonSize="M"
              disabled={fetching || !isDirty || !hasResults}
              onClick={handleClear}
            >
              {t('ksqlDb.query.actions.clearResults')}
            </Button>
            <Button
              buttonType="primary"
              buttonSize="M"
              type="submit"
              disabled={fetching}
              onClick={handleFocus}
            >
              {t('ksqlDb.query.actions.execute')}
            </Button>
          </S.ButtonsContainer>
        </form>
      </S.QueryWrapper>
    </FormProvider>
  );
};

export default QueryForm;
