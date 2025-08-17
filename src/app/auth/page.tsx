/**
* @fileoverview Página raiz para a seção de autenticação, redireciona para o login.
* @version 1.0
* @date 2024-07-30
* @author Vitapro
*/
import { redirect } from 'next/navigation';

export default function AuthPage() {
  redirect('/auth/login');
}
