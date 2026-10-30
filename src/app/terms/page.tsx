import Link from "next/link";
import { brand } from "@/config/brand";

const updatedAt = "21 de junio de 2026";

const business = {
  brand: brand.name,
  operator: `operador responsable de ${brand.name}`,
  email: brand.email,
  supportEmail: brand.supportEmail,
  whatsapp: "",
};

const sections = [
  { id: "identificacion", title: "1. Identificacion del proveedor" },
  { id: "aceptacion", title: "2. Aceptacion de los terminos" },
  { id: "cuenta", title: "3. Registro y cuenta de usuario" },
  { id: "productos", title: "4. Productos, precios y stock" },
  { id: "compra", title: "5. Compra, pago y confirmacion" },
  { id: "envios", title: "6. Envios y entregas" },
  { id: "cambios", title: "7. Cambios, devoluciones y garantias" },
  { id: "promociones", title: "8. Promociones, cupones y preventas" },
  { id: "datos", title: "9. Proteccion de datos personales" },
  { id: "marketing", title: "10. Comunicaciones comerciales" },
  { id: "reclamos", title: "11. Atencion al cliente e incidencias" },
  { id: "responsabilidad", title: "12. Responsabilidad y uso del sitio" },
  { id: "propiedad", title: "13. Propiedad intelectual" },
  { id: "cambios-terminos", title: "14. Cambios a estos terminos" },
  { id: "ley", title: "15. Ley aplicable y jurisdiccion" },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-4 pb-16 pt-32 text-zinc-950 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/register" className="text-sm font-semibold text-zinc-600 underline underline-offset-4">
            Volver al registro
          </Link>
          <p className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Actualizado: {updatedAt}
          </p>
        </div>

        <header className="space-y-4 border-b border-zinc-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Legal</p>
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">Terminos y condiciones</h1>
          <p className="max-w-3xl text-base leading-7 text-zinc-600">
            Estos terminos regulan el acceso, registro, compra y uso de los servicios digitales de {business.brand}, ecommerce peruano
            dedicado a la venta de ropa, accesorios y productos relacionados.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50 p-5 lg:sticky lg:top-28">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Indice</h2>
            <nav className="mt-4 space-y-2">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="block rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-white hover:text-zinc-950">
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="space-y-6">
            <LegalBlock id="identificacion" title="1. Identificacion del proveedor">
              <p>
                {business.brand} es operado inicialmente por una <strong>{business.operator}</strong>. Para consultas comerciales,
                atencion de pedidos, cambios, garantias o soporte, puedes comunicarte a <strong>{business.supportEmail}</strong> o
                al WhatsApp <strong>{business.whatsapp}</strong>.
              </p>
              <p>
                Si mas adelante cambia la forma de operacion del negocio, esta seccion sera actualizada con la informacion comercial
                que corresponda.
              </p>
            </LegalBlock>

            <LegalBlock id="aceptacion" title="2. Aceptacion de los terminos">
              <p>
                Al navegar, registrarte, iniciar una compra, realizar un pedido por WhatsApp o usar cualquier servicio de {business.brand},
                declaras haber leido y aceptado estos terminos. Si no estas de acuerdo, debes abstenerte de usar la web o realizar pedidos.
              </p>
              <p>
                La aceptacion se registra mediante acciones como marcar el checkbox de terminos, crear una cuenta, confirmar un pedido o
                realizar un pago. La version vigente sera la publicada en esta pagina al momento de la compra.
              </p>
            </LegalBlock>

            <LegalBlock id="cuenta" title="3. Registro y cuenta de usuario">
              <p>
                Para crear una cuenta solicitamos datos minimos: correo electronico, nombres, apellidos y contrasena. El usuario declara
                que la informacion ingresada es verdadera, actualizada y que tiene capacidad legal para contratar.
              </p>
              <p>
                El usuario es responsable de mantener la confidencialidad de sus credenciales. {business.brand} podra suspender o cerrar
                cuentas cuando detecte uso fraudulento, informacion falsa, intento de abuso de promociones o afectacion a terceros.
              </p>
              <p>
                Los invitados pueden navegar sin registrarse. Para compras, atencion posventa, historial de pedidos o promociones, puede
                requerirse registro o datos adicionales de contacto y entrega.
              </p>
            </LegalBlock>

            <LegalBlock id="productos" title="4. Productos, precios y stock">
              <p>
                Procuramos mostrar informacion clara sobre productos, tallas, colores, materiales, imagenes, precio, disponibilidad y
                condiciones de compra. Las imagenes son referenciales y pueden existir variaciones razonables por iluminacion, pantalla,
                lote de produccion o acabado artesanal.
              </p>
              <p>
                Los precios se expresan en soles peruanos, salvo que se indique lo contrario. El stock esta sujeto a confirmacion, sobre
                todo en ventas por WhatsApp, redes sociales, preventas, ferias o canales simultaneos.
              </p>
              <p>
                Si un producto no esta disponible luego de confirmado el pedido, se ofrecera reprogramacion, cambio por producto equivalente,
                nota de credito, cupon o devolucion del importe pagado, segun corresponda y previa coordinacion con el cliente.
              </p>
            </LegalBlock>

            <LegalBlock id="compra" title="5. Compra, pago y confirmacion">
              <p>
                El pedido queda sujeto a validacion de datos, disponibilidad, confirmacion de pago y verificacion antifraude. Una orden
                generada en la web no implica aceptacion definitiva hasta que {business.brand} confirme el pedido por el canal indicado.
              </p>
              <p>
                Los medios de pago disponibles pueden incluir transferencia, Yape, Plin, efectivo contra entrega o enlaces de pago,
                segun disponibilidad. El cliente debe verificar el monto, producto, talla, color, direccion y datos de contacto antes
                de confirmar.
              </p>
              <p>
                En caso de pagos observados, duplicados, rechazados, extornados o sospechosos, {business.brand} podra pausar el despacho
                hasta resolver la incidencia.
              </p>
            </LegalBlock>

            <LegalBlock id="envios" title="6. Envios y entregas">
              <p>
                Los plazos de entrega son estimados y dependen de la ubicacion, operador logistico, disponibilidad, horarios de corte,
                campanas de alta demanda, feriados, eventos externos o situaciones de fuerza mayor.
              </p>
              <p>
                El cliente debe proporcionar direccion completa, departamento, provincia, distrito, referencia, telefono activo y, si aplica,
                agencia preferida. {business.brand} no sera responsable por retrasos o costos adicionales causados por datos incompletos,
                errores del cliente, ausencia en domicilio o rechazo de recepcion.
              </p>
              <p>
                El riesgo de perdida o deterioro se evaluara caso por caso. Si el incidente es atribuible al operador logistico, se coordinara
                con dicho operador y se informara al cliente sobre el estado del proceso.
              </p>
            </LegalBlock>

            <LegalBlock id="cambios" title="7. Cambios, devoluciones y garantias">
              <p>
                Los cambios por talla, color o preferencia estan sujetos a disponibilidad, estado del producto y plazo informado en la web o
                canal de venta. El producto debe estar sin uso, sin lavado, sin manchas, sin olores, con etiquetas y empaque cuando corresponda.
              </p>
              <p>
                No se aceptan cambios o devoluciones por mal uso, desgaste normal, lavado incorrecto, manipulacion, productos personalizados,
                productos en liquidacion expresamente marcados como finales, o variaciones menores propias de pantalla/fotografia.
              </p>
              <p>
                Si el producto presenta defecto de fabricacion verificable, se ofrecera reparacion, cambio, reposicion o devolucion, segun
                corresponda. El cliente debe reportar el caso con fotos, video, numero de pedido y descripcion del problema.
              </p>
            </LegalBlock>

            <LegalBlock id="promociones" title="8. Promociones, cupones y preventas">
              <p>
                Las promociones, descuentos, cupones, sorteos y preventas tienen vigencia, stock, condiciones y restricciones especificas.
                No son acumulables salvo indicacion expresa.
              </p>
              <p>
                {business.brand} podra corregir errores evidentes de precio, disponibilidad o publicacion antes de confirmar el pedido. En
                preventas, el cliente acepta que la fecha de entrega puede variar por produccion, importacion, transporte o alta demanda.
              </p>
            </LegalBlock>

            <LegalBlock id="datos" title="9. Proteccion de datos personales">
              <p>
                {business.brand} tratara los datos personales conforme a la normativa peruana aplicable, incluyendo la Ley de Proteccion de
                Datos Personales. Los datos podran incluir nombres, apellidos, email, telefono, documento cuando sea necesario, direccion,
                historial de pedidos, preferencias y comunicaciones.
              </p>
              <p>
                Las finalidades principales son: crear y administrar cuentas, procesar pedidos, coordinar entregas, atender consultas,
                gestionar incidencias, prevenir fraude, cumplir obligaciones aplicables y mejorar la experiencia de compra.
              </p>
              <p>
                Las finalidades opcionales de marketing, promociones y comunicaciones comerciales requieren consentimiento o autorizacion del
                usuario. El usuario puede solicitar acceso, rectificacion, cancelacion, oposicion o retiro de consentimiento escribiendo a
                <strong> {business.email}</strong>.
              </p>
              <p>
                Podremos compartir datos estrictamente necesarios con proveedores de hosting, operadores logisticos, herramientas de
                email/WhatsApp, soporte tecnico y otros servicios necesarios para operar pedidos y atencion al cliente.
              </p>
            </LegalBlock>

            <LegalBlock id="marketing" title="10. Comunicaciones comerciales">
              <p>
                Si marcas la opcion de recibir promociones, autorizas el envio de novedades, cupones, lanzamientos y campanas por email,
                WhatsApp, SMS, redes sociales u otros canales informados.
              </p>
              <p>
                Puedes retirar tu autorizacion en cualquier momento escribiendo a <strong>{business.email}</strong> o siguiendo las instrucciones
                de baja incluidas en las comunicaciones cuando esten disponibles. La baja no afecta comunicaciones transaccionales necesarias
                para pedidos, pagos, envios o incidencias.
              </p>
            </LegalBlock>

            <LegalBlock id="reclamos" title="11. Atencion al cliente e incidencias">
              <p>
                Para consultas, cambios, garantias, incidencias de entrega o soporte, puedes escribir a <strong>{business.supportEmail}</strong>
                o WhatsApp <strong>{business.whatsapp}</strong>. Atenderemos las solicitudes en un plazo razonable segun complejidad del caso.
              </p>
              <p>
                Si tienes una disconformidad con un pedido, producto, entrega, pago o atencion recibida, comunicate por nuestros canales
                indicando tu nombre, telefono, producto, fecha de compra, evidencia disponible y una descripcion clara del caso.
              </p>
              <p>
                Buscaremos una solucion proporcional al caso: orientacion, seguimiento del envio, cambio, reposicion, reparacion,
                devolucion o coordinacion adicional, segun corresponda.
              </p>
            </LegalBlock>

            <LegalBlock id="responsabilidad" title="12. Responsabilidad y uso del sitio">
              <p>
                El usuario se compromete a no usar el sitio para fines ilicitos, fraude, suplantacion, ataques informaticos, extraccion masiva
                de datos, reventa no autorizada, abuso de promociones o afectacion de la operacion del ecommerce.
              </p>
              <p>
                {business.brand} no garantiza disponibilidad ininterrumpida del sitio. Podran existir mantenimientos, errores tecnicos,
                interrupciones de terceros, fallas de internet, problemas con canales de pago o eventos fuera de control razonable.
              </p>
            </LegalBlock>

            <LegalBlock id="propiedad" title="13. Propiedad intelectual">
              <p>
                La marca, disenos, fotografias, textos, videos, logos, interfaz, catalogo y contenido de {business.brand} pertenecen a sus
                titulares o se usan con autorizacion. No esta permitido copiar, reproducir, vender, modificar o explotar contenido sin permiso.
              </p>
              <p>
                El usuario que comparta fotos, resenas o contenido relacionado con productos autoriza a {business.brand} a republicarlo con
                fines promocionales, salvo que indique expresamente lo contrario por escrito.
              </p>
            </LegalBlock>

            <LegalBlock id="cambios-terminos" title="14. Cambios a estos terminos">
              <p>
                {business.brand} podra actualizar estos terminos para reflejar cambios legales, operativos, logisticos, tecnologicos o comerciales.
                La version vigente sera publicada en esta pagina con fecha de actualizacion.
              </p>
              <p>
                Los cambios no afectaran derechos ya adquiridos por compras confirmadas, salvo que sean necesarios por mandato legal o por
                seguridad del usuario.
              </p>
            </LegalBlock>

            <LegalBlock id="ley" title="15. Ley aplicable y jurisdiccion">
              <p>
                Estos terminos se rigen por las leyes de la Republica del Peru. Cualquier controversia sera atendida inicialmente por los
                canales de soporte de {business.brand}, buscando una solucion directa, razonable y documentada.
              </p>
              <p>
                Nada en estos terminos busca limitar derechos que pudieran corresponder al usuario segun la normativa peruana aplicable.
              </p>
            </LegalBlock>
          </article>
        </div>
      </section>
    </main>
  );
}

function LegalBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-zinc-950">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">{children}</div>
    </section>
  );
}
