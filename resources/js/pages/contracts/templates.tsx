import InputError from '@/components/input-error';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Property } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Building2,
    FileSignature,
    FileUp,
    Landmark,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface ContractArticle {
    id?: number;
    article_number: string;
    title: string;
    body: string;
    sort_order: number;
}

interface ContractTemplate {
    id: number;
    property_id?: number | null;
    name: string;
    contract_title: string;
    intro_text?: string | null;
    logo_url?: string | null;
    landlord_organization: string;
    representative_name: string;
    representative_position: string;
    representative_contact?: string | null;
    landlord_signature_label: string;
    tenant_signature_label: string;
    witness_signature_label: string;
    footer_text?: string | null;
    is_default: boolean;
    is_active: boolean;
    articles: ContractArticle[];
    property?: Property | null;
}

interface TemplateFormData {
    _method: string;
    property_id: string;
    name: string;
    contract_title: string;
    intro_text: string;
    logo: File | null;
    landlord_organization: string;
    representative_name: string;
    representative_position: string;
    representative_contact: string;
    landlord_signature_label: string;
    tenant_signature_label: string;
    witness_signature_label: string;
    footer_text: string;
    is_default: boolean;
    is_active: boolean;
    articles: ContractArticle[];
}

interface Props {
    templates: ContractTemplate[];
    properties: Property[];
}

const emptyArticle = (position: number): ContractArticle => ({
    article_number: `ماده ${position}`,
    title: '',
    body: '',
    sort_order: position,
});

const emptyTemplate = (): TemplateFormData => ({
    _method: 'post',
    property_id: '',
    name: 'قرارداد عمومی کرایه',
    contract_title: 'قرارداد اجاره جایداد تجارتی و رهایشی',
    intro_text:
        'این قرارداد میان :landlord_organization، به نمایندگی :landlord_name (:landlord_position)، و :tenant_name به حیث مستأجر، با رضایت کامل طرفین منعقد می‌گردد.',
    logo: null,
    landlord_organization: 'پکتیاوال گروپ',
    representative_name: '',
    representative_position: 'رئیس اجرائیه',
    representative_contact: '',
    landlord_signature_label: 'امضاء و مهر جانب مالک',
    tenant_signature_label: 'امضاء و نشان انگشت مستأجر',
    witness_signature_label: 'امضاء شاهد',
    footer_text:
        'این قرارداد در دو نسخه با اعتبار یکسان ترتیب و پس از امضاء و مهر طرفین نافذ می‌گردد.',
    is_default: false,
    is_active: true,
    articles: [emptyArticle(1)],
});

const propertyName = (property: Property, locale: string) =>
    property.name_translations?.[
        locale as keyof NonNullable<Property['name_translations']>
    ] || property.name;

export default function ContractTemplatesPage({ templates, properties }: Props) {
    const { t, isRtl, locale } = useLocalization();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ContractTemplate | null>(null);
    const [deleting, setDeleting] = useState<ContractTemplate | null>(null);

    const openCreate = () => {
        setEditing(null);
        setDialogOpen(true);
    };
    const openEdit = (template: ContractTemplate) => {
        setEditing(template);
        setDialogOpen(true);
    };

    return (
        <AppLayout>
            <Head title={t('contractTemplates.title')} />
            <div
                className="mx-auto w-full max-w-[1500px] space-y-6"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <section className="overflow-hidden rounded-3xl border bg-white p-6 sm:p-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/7 px-3 py-1.5 text-sm font-medium text-primary">
                                <FileSignature className="size-4" />
                                {t('navigation.toolContracts')}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {t('contractTemplates.title')}
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                                {t('contractTemplates.subtitle')}
                            </p>
                        </div>
                        <Button onClick={openCreate} className="h-11 rounded-xl px-5">
                            <Plus className="me-2 size-4" />
                            {t('contractTemplates.create')}
                        </Button>
                    </div>
                </section>

                {templates.length ? (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {templates.map((template) => (
                            <Card
                                key={template.id}
                                className="overflow-hidden rounded-2xl border bg-white shadow-none"
                            >
                                <CardContent className="p-0">
                                    <div className="flex items-start gap-4 p-5">
                                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#edf1f4]">
                                            {template.logo_url ? (
                                                <img
                                                    src={template.logo_url}
                                                    alt=""
                                                    className="h-full w-full object-contain p-2"
                                                />
                                            ) : (
                                                <Landmark className="size-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap gap-1.5">
                                                {template.is_default && (
                                                    <Badge>{t('contractTemplates.default')}</Badge>
                                                )}
                                                <Badge variant="outline">
                                                    {template.is_active
                                                        ? t('contractTemplates.active')
                                                        : t('contractTemplates.inactive')}
                                                </Badge>
                                            </div>
                                            <h2 className="mt-3 truncate text-lg font-semibold">
                                                {template.name}
                                            </h2>
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {template.contract_title}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="border-y bg-[#f8f9fd] px-5 py-3 text-sm">
                                        <p className="flex items-center gap-2 font-medium">
                                            <Building2 className="size-4 text-muted-foreground" />
                                            {template.property
                                                ? propertyName(template.property, locale)
                                                : t('contractTemplates.global')}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {template.articles.length}{' '}
                                            {t('contractTemplates.articles')}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 p-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEdit(template)}
                                        >
                                            <Pencil className="me-2 size-4" />
                                            {t('contractTemplates.edit')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleting(template)}
                                            aria-label={t('contractTemplates.actions.delete')}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed bg-white py-20 text-center text-muted-foreground">
                        <FileSignature className="mx-auto mb-3 size-10 opacity-35" />
                        {t('contractTemplates.empty')}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent
                    className="max-h-[94vh] overflow-y-auto rounded-2xl sm:max-w-5xl"
                    dir="rtl"
                >
                    <DialogHeader className="text-right sm:text-right">
                        <DialogTitle>
                            {editing
                                ? t('contractTemplates.edit')
                                : t('contractTemplates.create')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('contractTemplates.subtitle')}
                        </DialogDescription>
                    </DialogHeader>
                    <TemplateForm
                        key={editing?.id ?? 'new'}
                        template={editing}
                        properties={properties}
                        locale={locale}
                        onDone={() => setDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader className={isRtl ? 'text-right sm:text-right' : ''}>
                        <AlertDialogTitle>
                            {t('contractTemplates.actions.delete')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('contractTemplates.actions.deleteConfirm')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('contractTemplates.actions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                                if (deleting) {
                                    router.delete(`/contract-templates/${deleting.id}`, {
                                        preserveScroll: true,
                                        onFinish: () => setDeleting(null),
                                    });
                                }
                            }}
                        >
                            {t('contractTemplates.actions.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

function TemplateForm({
    template,
    properties,
    locale,
    onDone,
}: {
    template: ContractTemplate | null;
    properties: Property[];
    locale: string;
    onDone: () => void;
}) {
    const { t } = useLocalization();
    const initial = useMemo<TemplateFormData>(
        () =>
            template
                ? {
                      _method: 'put',
                      property_id: template.property_id
                          ? String(template.property_id)
                          : '',
                      name: template.name,
                      contract_title: template.contract_title,
                      intro_text: template.intro_text ?? '',
                      logo: null,
                      landlord_organization: template.landlord_organization,
                      representative_name: template.representative_name,
                      representative_position: template.representative_position,
                      representative_contact:
                          template.representative_contact ?? '',
                      landlord_signature_label:
                          template.landlord_signature_label,
                      tenant_signature_label: template.tenant_signature_label,
                      witness_signature_label: template.witness_signature_label,
                      footer_text: template.footer_text ?? '',
                      is_default: template.is_default,
                      is_active: template.is_active,
                      articles: template.articles.map((article, index) => ({
                          ...article,
                          sort_order: index + 1,
                      })),
                  }
                : emptyTemplate(),
        [template],
    );
    const form = useForm<TemplateFormData>(initial);

    const updateArticle = (
        index: number,
        key: keyof Pick<ContractArticle, 'article_number' | 'title' | 'body'>,
        value: string,
    ) => {
        form.setData(
            'articles',
            form.data.articles.map((article, articleIndex) =>
                articleIndex === index ? { ...article, [key]: value } : article,
            ),
        );
    };
    const moveArticle = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= form.data.articles.length) return;
        const next = [...form.data.articles];
        [next[index], next[target]] = [next[target], next[index]];
        form.setData(
            'articles',
            next.map((article, articleIndex) => ({
                ...article,
                sort_order: articleIndex + 1,
            })),
        );
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(
            template
                ? `/contract-templates/${template.id}`
                : '/contract-templates',
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: onDone,
            },
        );
    };
    const field = (
        key: keyof Pick<
            TemplateFormData,
            | 'name'
            | 'contract_title'
            | 'landlord_organization'
            | 'representative_name'
            | 'representative_position'
            | 'representative_contact'
            | 'landlord_signature_label'
            | 'tenant_signature_label'
            | 'witness_signature_label'
        >,
        label: string,
    ) => (
        <div className="space-y-1.5">
            <Label htmlFor={`contract-${key}`}>{label}</Label>
            <Input
                id={`contract-${key}`}
                value={form.data[key]}
                onChange={(event) => form.setData(key, event.target.value)}
                className="bg-white text-right"
            />
            <InputError message={form.errors[key]} />
        </div>
    );

    return (
        <form onSubmit={submit} className="space-y-7">
            <section className="space-y-4 rounded-2xl border bg-[#f8f9fd] p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                    <Landmark className="size-4 text-primary" />
                    {t('contractTemplates.branding')}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {field('name', t('contractTemplates.fields.name'))}
                    {field('contract_title', t('contractTemplates.fields.title'))}
                    <div className="space-y-1.5">
                        <Label>{t('contractTemplates.fields.property')}</Label>
                        <SearchableDropdown
                            value={form.data.property_id}
                            onValueChange={(value) =>
                                form.setData('property_id', value)
                            }
                            placeholder={t('contractTemplates.global')}
                            options={[
                                {
                                    value: '',
                                    label: t('contractTemplates.global'),
                                },
                                ...properties.map((property) => ({
                                    value: String(property.id),
                                    label: propertyName(property, locale),
                                })),
                            ]}
                        />
                        <InputError message={form.errors.property_id} />
                    </div>
                    {field(
                        'landlord_organization',
                        t('contractTemplates.fields.organization'),
                    )}
                    <div className="space-y-1.5 md:col-span-2">
                        <Label>{t('contractTemplates.fields.intro')}</Label>
                        <Textarea
                            rows={4}
                            value={form.data.intro_text}
                            onChange={(event) =>
                                form.setData('intro_text', event.target.value)
                            }
                            className="bg-white text-right leading-7"
                        />
                        <InputError message={form.errors.intro_text} />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold">
                    <UserRound className="size-4 text-primary" />
                    {t('contractTemplates.representative')}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {field(
                        'representative_name',
                        t('contractTemplates.fields.representativeName'),
                    )}
                    {field(
                        'representative_position',
                        t('contractTemplates.fields.representativePosition'),
                    )}
                    {field(
                        'representative_contact',
                        t('contractTemplates.fields.representativeContact'),
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <FileSignature className="size-4 text-primary" />
                        {t('contractTemplates.articles')}
                    </h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            form.setData('articles', [
                                ...form.data.articles,
                                emptyArticle(form.data.articles.length + 1),
                            ])
                        }
                    >
                        <Plus className="me-2 size-4" />
                        {t('contractTemplates.actions.addArticle')}
                    </Button>
                </div>
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">
                        {t('contractTemplates.placeholders')}
                    </p>
                    {t('contractTemplates.placeholdersHelp')}
                </div>
                <div className="space-y-3">
                    {form.data.articles.map((article, index) => (
                        <div
                            key={`${article.id ?? 'new'}-${index}`}
                            className="rounded-2xl border bg-white p-4"
                        >
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <Badge variant="secondary">{index + 1}</Badge>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={index === 0}
                                        onClick={() => moveArticle(index, -1)}
                                        aria-label={t(
                                            'contractTemplates.actions.moveUp',
                                        )}
                                    >
                                        <ArrowUp className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={
                                            index === form.data.articles.length - 1
                                        }
                                        onClick={() => moveArticle(index, 1)}
                                        aria-label={t(
                                            'contractTemplates.actions.moveDown',
                                        )}
                                    >
                                        <ArrowDown className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={form.data.articles.length === 1}
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                            form.setData(
                                                'articles',
                                                form.data.articles.filter(
                                                    (_, articleIndex) =>
                                                        articleIndex !== index,
                                                ),
                                            )
                                        }
                                        aria-label={t(
                                            'contractTemplates.actions.removeArticle',
                                        )}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-[170px_1fr]">
                                <div className="space-y-1.5">
                                    <Label>
                                        {t('contractTemplates.fields.articleNumber')}
                                    </Label>
                                    <Input
                                        value={article.article_number}
                                        onChange={(event) =>
                                            updateArticle(
                                                index,
                                                'article_number',
                                                event.target.value,
                                            )
                                        }
                                        className="bg-white text-right"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>
                                        {t('contractTemplates.fields.articleTitle')}
                                    </Label>
                                    <Input
                                        value={article.title}
                                        onChange={(event) =>
                                            updateArticle(
                                                index,
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                        className="bg-white text-right"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>
                                        {t('contractTemplates.fields.articleBody')}
                                    </Label>
                                    <Textarea
                                        rows={4}
                                        value={article.body}
                                        onChange={(event) =>
                                            updateArticle(
                                                index,
                                                'body',
                                                event.target.value,
                                            )
                                        }
                                        className="bg-white text-right leading-7"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <InputError message={form.errors.articles} />
            </section>

            <section className="space-y-4 rounded-2xl border bg-[#f8f9fd] p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="size-4 text-primary" />
                    {t('contractTemplates.signatures')}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {field(
                        'landlord_signature_label',
                        t('contractTemplates.fields.landlordSignature'),
                    )}
                    {field(
                        'tenant_signature_label',
                        t('contractTemplates.fields.tenantSignature'),
                    )}
                    {field(
                        'witness_signature_label',
                        t('contractTemplates.fields.witnessSignature'),
                    )}
                    <div className="space-y-1.5 md:col-span-3">
                        <Label>{t('contractTemplates.fields.footer')}</Label>
                        <Textarea
                            rows={3}
                            value={form.data.footer_text}
                            onChange={(event) =>
                                form.setData('footer_text', event.target.value)
                            }
                            className="bg-white text-right leading-7"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-2">
                    <Label>{t('contractTemplates.fields.logo')}</Label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed bg-white p-4 transition hover:border-primary/50 hover:bg-primary/3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-[#edf1f4] text-primary">
                            <FileUp className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">
                                {form.data.logo?.name ??
                                    t('contractTemplates.fields.logo')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                PNG، JPG، WEBP · 5MB
                            </span>
                        </span>
                        <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                                form.setData(
                                    'logo',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                        />
                    </label>
                    <InputError message={form.errors.logo} />
                </div>
                <div className="flex flex-wrap gap-5 rounded-2xl border bg-white px-5 py-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.data.is_active}
                            onCheckedChange={(value) =>
                                form.setData('is_active', Boolean(value))
                            }
                        />
                        {t('contractTemplates.fields.isActive')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                            checked={form.data.is_default}
                            onCheckedChange={(value) =>
                                form.setData('is_default', Boolean(value))
                            }
                        />
                        {t('contractTemplates.fields.isDefault')}
                    </label>
                </div>
            </section>

            <div className="flex justify-end gap-2 border-t pt-5">
                <Button type="button" variant="outline" onClick={onDone}>
                    {t('contractTemplates.actions.cancel')}
                </Button>
                <Button type="submit" disabled={form.processing}>
                    <FileSignature className="me-2 size-4" />
                    {t('contractTemplates.actions.save')}
                </Button>
            </div>
        </form>
    );
}
