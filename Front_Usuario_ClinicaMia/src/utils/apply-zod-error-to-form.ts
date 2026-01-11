import { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ZodIssue } from "zod";


export function getErrorIssues(error: unknown): ZodIssue[] {
    const isZodError =
        typeof error === "object" &&
        (error as any)?.name === "ZodError" &&
        Array.isArray((error as any)?.issues)
    if (!isZodError) return []
    return (error as any).issues
}

/**
 * Aplica errores de validación de Zod a un formulario de React Hook Form.
 * Mapea automáticamente cada error de Zod al campo correspondiente del formulario.
 * El uso mas general que se le da es para issues traidas desde la API del servidor.
 * Pero puedo aplicar a cualquier tipo de zodError.
 * 
 * @param error - Error capturado (típicamente de una petición API)
 * @param setError - Función setError de React Hook Form
 * 
 * @example
 * ```ts
 * // Definir schema
 * const productSchema = z.object({
 *   name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
 *   price: z.number().positive('Precio debe ser positivo'),
 *   category: z.string().min(1, 'Categoría es requerida')
 * });
 * 
 * type ProductForm = z.infer<typeof productSchema>;
 * 
 * // En el componente
 * const { handleSubmit, setError } = useForm<ProductForm>({
 *   resolver: zodResolver(productSchema)
 * });
 * 
 * const { mutate: createProduct } = $api.useMutation('post', '/products', {
 *   onSuccess: () => {
 *     toast.success('Producto creado');
 *   },
 *   onError(error) {
 *     // Aplica automáticamente los errores del servidor al formulario
 *     applyZodErrorsToForm(error.error, setError);
 *   }
 * });
 * 
 * const onSubmit = (data: ProductForm) => {
 *   createProduct({ body: data });
 * };
 * ```
 */
export function applyZodErrorsToForm<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {

    const issues = getErrorIssues(error)

    issues.forEach(issue => {
        const field = issue.path.join(".") as Path<T>;
        setError(field, { type: "manual", message: issue.message });
    });
}